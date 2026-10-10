"""Postcode -> MP lookup for the contact-MP flow."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection

from db import get_db
from lookup import LookupUnavailable, lookup_postcode, normalise_postcode
from models import Mp

router = APIRouter()


@router.get("/mp/lookup", response_model=Mp, response_model_by_alias=True)
def lookup_mp(
    db: Annotated[Connection, Depends(get_db)],
    postcode: Annotated[str, Query(min_length=5, max_length=10)],
) -> Mp:
    normalised = normalise_postcode(postcode)
    if not normalised:
        raise HTTPException(422, "Enter a full UK postcode, for example DN1 3LN.")

    try:
        info = lookup_postcode(db, normalised)
    except LookupUnavailable:
        raise HTTPException(502, "The postcode lookup service is unavailable. Please try again shortly.")
    if not info:
        raise HTTPException(404, "We couldn't find that postcode.")
    if not info.constituency:
        raise HTTPException(404, "That postcode isn't in a Westminster constituency.")

    row = db.execute(
        "select full_name, party, email, constituency from mps where lower(constituency) = lower(%s)",
        (info.constituency,),
    ).fetchone()
    if not row:
        raise HTTPException(404, f"No MP found for {info.constituency}.")

    return Mp(
        name=row["full_name"],
        party=row["party"],
        email=row["email"],
        constituency=row["constituency"],
        postcode=info.postcode,
    )
