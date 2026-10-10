from datetime import datetime, timezone
import secrets

from fastapi import FastAPI
from fastapi import HTTPException

from pydantic import BaseModel

# Services preserve the public request path, including /openapi.
app = FastAPI(
    docs_url="/docs",
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


class ChurchSubmission(BaseModel):
    name: str
    denomination: str = ""
    address: str
    place: str = ""
    postcode: str = ""
    operatingHours: str = ""
    contactName: str
    contactEmail: str
    initiatives: list[str] = []


class ChurchStatusUpdate(BaseModel):
    status: str


@app.get("/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}


# A list to hold all submitted churches. It lives at the top level, so it
# persists between requests while the server is running.
churches = []


@app.post("/churches", status_code=201)
def create_church(submission: ChurchSubmission):
    record = {
        "id": f"sub-{secrets.token_hex(6)}",
        "status": "pending",
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        **submission.model_dump()
    }
    churches.append(record)
    return record


@app.get("/churches")
def list_churches(status: str | None = None):
    if status is None:
        return churches
    return [church for church in churches if church["status"] == status]


@app.patch("/churches/{church_id}")
def update_church_status(church_id: str, update: ChurchStatusUpdate):
    for church in churches:
        if church["id"] == church_id:
            church["status"] = update.status
            return church
    raise HTTPException(status_code=404, detail="Church not found")
