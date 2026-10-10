"""Postcode and place lookups.

The database only holds postcodes near member churches, so anything missing
falls back to postcodes.io (free, no API key).
"""

import re
from dataclasses import dataclass

import httpx
from psycopg import Connection

POSTCODES_IO = "https://api.postcodes.io"

FULL_POSTCODE = re.compile(r"^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$")
OUTCODE = re.compile(r"^[A-Z]{1,2}\d[A-Z\d]?$")


class LookupUnavailable(Exception):
    """postcodes.io could not be reached or returned an unexpected error."""


@dataclass
class PostcodeInfo:
    postcode: str
    lat: float
    lng: float
    constituency: str | None


def normalise_postcode(value: str) -> str | None:
    """'dn13ln' -> 'DN1 3LN'; returns None if it isn't a full UK postcode."""
    compact = re.sub(r"\s+", "", value).upper()
    match = FULL_POSTCODE.match(compact)
    return f"{match[1]} {match[2]}" if match else None


def _postcodes_io(path: str, params: dict | None = None) -> dict | list | None:
    try:
        response = httpx.get(f"{POSTCODES_IO}{path}", params=params, timeout=5)
    except httpx.HTTPError as error:
        raise LookupUnavailable(str(error)) from error
    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise LookupUnavailable(f"postcodes.io returned {response.status_code}")
    return response.json().get("result")


def lookup_postcode(db: Connection, postcode: str) -> PostcodeInfo | None:
    """Resolve a normalised full postcode to coordinates and constituency."""
    row = db.execute(
        "select lat, lng, constituency from postcodes where postcode = %s and found",
        (postcode,),
    ).fetchone()
    if row:
        return PostcodeInfo(postcode, row["lat"], row["lng"], row["constituency"])

    result = _postcodes_io(f"/postcodes/{postcode}")
    if not result or result.get("latitude") is None:
        return None
    constituency = result.get("parliamentary_constituency_2024") or result.get("parliamentary_constituency")
    return PostcodeInfo(result["postcode"], result["latitude"], result["longitude"], constituency)


def geocode(db: Connection, query: str) -> tuple[float, float] | None:
    """Resolve a full postcode, postcode area (outcode) or place name to (lat, lng)."""
    text = query.strip()
    if not text:
        return None

    postcode = normalise_postcode(text)
    if postcode:
        info = lookup_postcode(db, postcode)
        return (info.lat, info.lng) if info else None

    compact = re.sub(r"\s+", "", text).upper()
    if OUTCODE.match(compact):
        row = db.execute(
            "select lat, lng from outcodes where outcode = %s and found", (compact,)
        ).fetchone()
        if row:
            return row["lat"], row["lng"]
        result = _postcodes_io(f"/outcodes/{compact}")
        if result and result.get("latitude") is not None:
            return result["latitude"], result["longitude"]
        return None

    # Place name: centre of member churches whose address names that place,
    # otherwise ask postcodes.io's place index.
    row = db.execute(
        "select avg(lat) as lat, avg(lng) as lng from churches where lower(address) ~ %s",
        (rf"(^|, ){re.escape(text.lower())}(,|$)",),
    ).fetchone()
    if row and row["lat"] is not None:
        return row["lat"], row["lng"]

    places = _postcodes_io("/places", {"q": text, "limit": 1})
    if places:
        return places[0]["latitude"], places[0]["longitude"]
    return None
