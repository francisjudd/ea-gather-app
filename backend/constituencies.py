"""Constituency directory: list constituencies and show one constituency's detail.

Replaces the frontend's generated JSON (lib/constituencies/generated) which was
built from data-source/combined.db. The same aggregation is now served from
Postgres so the frontend can fetch it from the API.
"""

import re
import unicodedata
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from psycopg import Connection

from db import get_db
from models import (
    ConstituencyChurch,
    ConstituencyDetail,
    ConstituencyMp,
    ConstituencyProgramme,
    ConstituencyService,
    ConstituencySummary,
)

router = APIRouter()

# Same slug rules as frontend/lib/constituencies/slug.ts and the old
# scripts/export-constituencies.mjs: accents stripped, "&" becomes "and".
def slugify_constituency(name: str) -> str:
    text = unicodedata.normalize("NFKD", name)
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def _nz(value):
    return None if value == "" or value is None else value


def _constituency_rows(db: Connection) -> dict[str, dict]:
    """Group churches and services by constituency slug.

    Returns { slug: { slug, name, code, churches: [], services: [] } }.
    """
    by_slug: dict[str, dict] = {}

    def entry(name: str, code: str | None) -> dict:
        slug = slugify_constituency(name)
        if slug not in by_slug:
            by_slug[slug] = {"slug": slug, "name": name, "code": _nz(code), "churches": [], "services": []}
        return by_slug[slug]

    churches = db.execute(
        """
        select c.id, c.slug, c.name, c.denomination, c.address, c.postcode,
               c.lat, c.lng, c.website, c.phone, c.constituency, c.constituency_code
        from churches c
        where c.constituency is not null and c.constituency != '' and c.constituency not like '(%'
        order by c.name
        """
    ).fetchall()

    services = db.execute(
        """
        select s.id, cat.name as category, s.name, s.address, s.postcode,
               s.lat, s.lng, s.website, s.phone, s.constituency, s.constituency_code
        from services s
        left join categories cat on cat.id = s.category_id
        where s.constituency is not null and s.constituency != '' and s.constituency not like '(%'
          and s.name is not null
        order by s.name
        """
    ).fetchall()

    # Programmes linked to each church (church_services), de-duplicated by name + category.
    programmes_by_church: dict[int, list[ConstituencyProgramme]] = {}
    for row in db.execute(
        """
        select cs.church_id, s.name, cat.name as category
        from church_services cs
        join services s on s.id = cs.service_id
        left join categories cat on cat.id = s.category_id
        where s.name is not null
        order by s.name
        """
    ).fetchall():
        programme = ConstituencyProgramme(name=row["name"], category=row["category"] or "Other")
        existing = programmes_by_church.setdefault(row["church_id"], [])
        if not any(p.name == programme.name and p.category == programme.category for p in existing):
            existing.append(programme)

    for row in churches:
        entry(row["constituency"], row["constituency_code"])["churches"].append(
            ConstituencyChurch(
                id=row["slug"],
                name=row["name"],
                denomination=_nz(row["denomination"]),
                address=_nz(row["address"]),
                postcode=_nz(row["postcode"]),
                lat=row["lat"],
                lng=row["lng"],
                website=_nz(row["website"]),
                phone=_nz(row["phone"]),
                programmes=programmes_by_church.get(row["id"], []),
            )
        )

    for row in services:
        entry(row["constituency"], row["constituency_code"])["services"].append(
            ConstituencyService(
                id=str(row["id"]),
                category=row["category"] or "Other",
                name=row["name"],
                address=_nz(row["address"]),
                postcode=_nz(row["postcode"]),
                lat=row["lat"],
                lng=row["lng"],
                website=_nz(row["website"]),
                phone=_nz(row["phone"]),
            )
        )

    return by_slug


def _mp_for(db: Connection, name: str) -> ConstituencyMp | None:
    row = db.execute(
        "select full_name, party, email from mps where lower(constituency) = lower(%s)",
        (name,),
    ).fetchone()
    if not row:
        return None
    return ConstituencyMp(name=row["full_name"], party=row["party"], email=row["email"])


def _summary(entry: dict) -> ConstituencySummary:
    return ConstituencySummary(
        slug=entry["slug"],
        name=entry["name"],
        code=entry["code"],
        church_count=len(entry["churches"]),
        service_count=len(entry["services"]),
    )


@router.get("/areas", response_model=list[ConstituencySummary], response_model_by_alias=True)
def list_areas(db: Annotated[Connection, Depends(get_db)]) -> list[ConstituencySummary]:
    entries = _constituency_rows(db).values()
    return [_summary(entry) for entry in sorted(entries, key=lambda item: item["name"].lower())]


@router.get("/areas/details", response_model=list[ConstituencyDetail], response_model_by_alias=True)
def list_area_details(db: Annotated[Connection, Depends(get_db)]) -> list[ConstituencyDetail]:
    """Return every constituency with its full detail in one call.

    The frontend's /services page needs the services for many constituencies at
    once; fetching them one-by-one would be hundreds of round trips. This bulk
    endpoint lets it load everything in a single request.
    """
    entries = _constituency_rows(db)
    details: list[ConstituencyDetail] = []
    for entry in sorted(entries.values(), key=lambda item: item["name"].lower()):
        services_by_category: dict[str, int] = {}
        for service in entry["services"]:
            services_by_category[service.category] = services_by_category.get(service.category, 0) + 1
        summary = _summary(entry)
        details.append(
            ConstituencyDetail(
                **summary.model_dump(),
                mp=_mp_for(db, entry["name"]),
                churches=entry["churches"],
                services=entry["services"],
                services_by_category=services_by_category,
            )
        )
    return details


@router.get("/areas/{slug}", response_model=ConstituencyDetail, response_model_by_alias=True)
def get_area(slug: str, db: Annotated[Connection, Depends(get_db)]) -> ConstituencyDetail:
    entries = _constituency_rows(db)
    entry = entries.get(slug)
    if not entry:
        raise HTTPException(404, "Constituency not found")

    services_by_category: dict[str, int] = {}
    for service in entry["services"]:
        services_by_category[service.category] = services_by_category.get(service.category, 0) + 1

    summary = _summary(entry)
    return ConstituencyDetail(
        **summary.model_dump(),
        mp=_mp_for(db, entry["name"]),
        churches=entry["churches"],
        services=entry["services"],
        services_by_category=services_by_category,
    )
