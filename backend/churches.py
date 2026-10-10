"""Church directory, initiative taxonomy, geocoding and church submissions."""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from db import get_db
from lookup import LookupUnavailable, geocode
from models import Church, ChurchSubmission, ChurchSubmissionIn, GeocodeResult, Initiative

router = APIRouter()

EARTH_RADIUS_MILES = 3958.8

# Trailing address parts that are a county or country rather than the town.
COUNTIES = {
    "avon", "clwyd", "cornwall", "cumbria", "devon", "dorset", "dyfed", "east sussex", "england",
    "essex", "fife", "greater london", "greater manchester", "gwent", "gwynedd", "humberside",
    "isle of wight", "kent", "lothian", "merseyside", "mid glamorgan", "middlesex", "norfolk",
    "north humberside", "north yorkshire", "northern ireland", "northumberland", "powys", "rutland",
    "scotland", "somerset", "south glamorgan", "south humberside", "south yorkshire", "suffolk",
    "surrey", "tyne and wear", "uk", "united kingdom", "wales", "west glamorgan", "west midlands",
    "west sussex", "west yorkshire", "east yorkshire", "cleveland",
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def place_from_address(address: str) -> str:
    """'Ward Street, Lostock Hall, Preston, Lancashire' -> 'Preston'."""
    parts = [part.strip() for part in address.split(",") if part.strip()]
    while len(parts) > 1 and (
        parts[-1].lower() in COUNTIES
        or parts[-1].lower().endswith("shire")
        or parts[-1].lower().startswith("county ")
    ):
        parts.pop()
    return parts[-1] if parts else ""


def initiative_names(db: Connection) -> dict[str, str]:
    """Map initiative id (slug) -> category name."""
    rows = db.execute("select name from categories").fetchall()
    return {slugify(row["name"]): row["name"] for row in rows}


CHURCH_SELECT = """
select c.slug, c.name, c.address, c.postcode, c.lat, c.lng, c.denomination,
       c.website, c.phone, c.constituency,
       coalesce(array_agg(distinct cat.name) filter (where cat.name is not null), '{{}}') as categories,
       {distance} as distance_miles
from churches c
left join church_services cs on cs.church_id = c.id
left join services s on s.id = cs.service_id
left join categories cat on cat.id = s.category_id
where {where}
group by c.id
{having}
order by {order}
limit %(limit)s
"""

DISTANCE_SQL = (
    f"{EARTH_RADIUS_MILES} * 2 * asin(sqrt("
    "power(sin(radians(c.lat - %(lat)s) / 2), 2) + "
    "cos(radians(%(lat)s)) * cos(radians(c.lat)) * power(sin(radians(c.lng - %(lng)s) / 2), 2)))"
)


def to_church(row: dict) -> Church:
    return Church(
        id=row["slug"],
        name=row["name"] or "",
        address=row["address"] or "",
        place=place_from_address(row["address"] or ""),
        postcode=row["postcode"],
        lat=row["lat"],
        lng=row["lng"],
        denomination=row["denomination"] or "",
        # No service-time data yet; the frontend treats '' as "hours not listed".
        operating_hours="",
        # Every church in the directory is an Evangelical Alliance member.
        verified=True,
        initiatives=sorted(slugify(name) for name in row["categories"]),
        website=row["website"],
        phone=row["phone"],
        constituency=row["constituency"],
        distance_miles=round(row["distance_miles"], 2) if row["distance_miles"] is not None else None,
    )


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/churches", response_model=list[Church], response_model_by_alias=True)
def list_churches(
    db: Annotated[Connection, Depends(get_db)],
    q: Annotated[str | None, Query(max_length=200, description="Text match on name, address or constituency")] = None,
    letter: Annotated[str | None, Query(pattern="^[A-Za-z]$", description="First letter of the church name")] = None,
    initiatives: Annotated[str | None, Query(description="Comma-separated initiative ids; churches must offer all")] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lng: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius: Annotated[float, Query(gt=0, le=500, description="Miles from lat/lng")] = 15,
    limit: Annotated[int, Query(ge=1, le=5000)] = 5000,
) -> list[Church]:
    if (lat is None) != (lng is None):
        raise HTTPException(422, "Provide both lat and lng, or neither.")

    params: dict = {"limit": limit, "lat": lat, "lng": lng, "radius": radius}
    where = ["true"]
    having = ""

    if q and q.strip():
        where.append("(c.name || ' ' || c.address || ' ' || coalesce(c.constituency, '')) ilike %(q)s")
        params["q"] = f"%{escape_like(q.strip())}%"
    if letter:
        where.append("upper(substring(c.name from '[A-Za-z]')) = %(letter)s")
        params["letter"] = letter.upper()
    if initiatives:
        names = initiative_names(db)
        wanted = [item.strip() for item in initiatives.split(",") if item.strip()]
        unknown = [item for item in wanted if item not in names]
        if unknown:
            raise HTTPException(422, f"Unknown initiative id(s): {', '.join(unknown)}")
        having = "having array_agg(cat.name) @> %(categories)s::text[]"
        params["categories"] = [names[item] for item in wanted]

    if lat is not None:
        distance = DISTANCE_SQL
        where.append(f"{DISTANCE_SQL} <= %(radius)s")
        order = "distance_miles, c.name"
    else:
        distance = "null::double precision"
        order = "c.name"

    sql = CHURCH_SELECT.format(distance=distance, where=" and ".join(where), having=having, order=order)
    return [to_church(row) for row in db.execute(sql, params).fetchall()]


@router.get("/churches/{church_id}", response_model=Church, response_model_by_alias=True)
def get_church(church_id: str, db: Annotated[Connection, Depends(get_db)]) -> Church:
    sql = CHURCH_SELECT.format(
        distance="null::double precision", where="c.slug = %(slug)s", having="", order="c.name"
    )
    row = db.execute(sql, {"slug": church_id, "limit": 1}).fetchone()
    if not row:
        raise HTTPException(404, "Church not found")
    return to_church(row)


@router.post("/churches", response_model=ChurchSubmission, response_model_by_alias=True, status_code=201)
def submit_church(body: ChurchSubmissionIn, db: Annotated[Connection, Depends(get_db)]) -> ChurchSubmission:
    """Submit a church for review. It appears in the directory only after an admin approves it."""
    row = db.execute(
        """
        insert into church_submissions
            (name, denomination, address, place, postcode, operating_hours,
             contact_name, contact_email, initiatives)
        values (%(name)s, %(denomination)s, %(address)s, %(place)s, %(postcode)s, %(operating_hours)s,
                %(contact_name)s, %(contact_email)s, %(initiatives)s)
        returning *
        """,
        body.model_dump(),
    ).fetchone()
    return to_submission(row)


def to_submission(row: dict) -> ChurchSubmission:
    return ChurchSubmission(**{**row, "id": str(row["id"])})


@router.get("/initiatives", response_model=list[Initiative], response_model_by_alias=True)
def list_initiatives(db: Annotated[Connection, Depends(get_db)]) -> list[Initiative]:
    return [Initiative(id=slug, label=name) for slug, name in sorted(initiative_names(db).items(), key=lambda item: item[1])]


@router.get("/geocode", response_model=GeocodeResult, response_model_by_alias=True)
def geocode_query(
    db: Annotated[Connection, Depends(get_db)],
    q: Annotated[str, Query(min_length=1, max_length=100, description="Postcode, postcode area or place name")],
) -> GeocodeResult:
    try:
        result = geocode(db, q)
    except LookupUnavailable:
        raise HTTPException(502, "The postcode lookup service is unavailable. Please try again shortly.")
    if not result:
        raise HTTPException(404, "We couldn't find that location.")
    return GeocodeResult(lat=result[0], lng=result[1])
