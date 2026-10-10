"""Admin review of church submissions.

Protected by a shared token: send `Authorization: Bearer <ADMIN_TOKEN>`.
If ADMIN_TOKEN isn't configured, every admin request is refused.
"""

import os
import secrets
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from psycopg import Connection

from churches import to_submission
from db import get_db
from models import ChurchSubmission, SubmissionStatus, SubmissionUpdate


def require_admin(authorization: Annotated[str | None, Header()] = None) -> None:
    expected = os.environ.get("ADMIN_TOKEN")
    if not expected:
        raise HTTPException(503, "Admin access is not configured.")
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(token.encode(), expected.encode()):
        raise HTTPException(401, "Invalid admin token.", headers={"WWW-Authenticate": "Bearer"})


router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@router.get("/submissions", response_model=list[ChurchSubmission], response_model_by_alias=True)
def list_submissions(
    db: Annotated[Connection, Depends(get_db)],
    status: Annotated[SubmissionStatus, Query()] = "pending",
) -> list[ChurchSubmission]:
    rows = db.execute(
        "select * from church_submissions where status = %s order by submitted_at",
        (status,),
    ).fetchall()
    return [to_submission(row) for row in rows]


@router.patch("/submissions/{submission_id}", response_model=ChurchSubmission, response_model_by_alias=True)
def update_submission(
    submission_id: UUID,
    body: SubmissionUpdate,
    db: Annotated[Connection, Depends(get_db)],
) -> ChurchSubmission:
    changes = body.model_dump(exclude_none=True)
    if not changes:
        raise HTTPException(422, "Nothing to update: send status and/or initiatives.")

    assignments = ", ".join(f"{column} = %({column})s" for column in changes)
    row = db.execute(
        f"update church_submissions set {assignments} where id = %(id)s returning *",
        {**changes, "id": submission_id},
    ).fetchone()
    if not row:
        raise HTTPException(404, "Submission not found")
    return to_submission(row)
