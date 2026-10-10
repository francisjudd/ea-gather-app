from datetime import datetime, timezone
import secrets

from fastapi import FastAPI
from fastapi import HTTPException

from pydantic import BaseModel

import admin
import churches as churches_api
import mps

# vercel.json strips the /openapi prefix before forwarding to this service, so
# routes are defined without it. The frontend always calls same-origin
# /openapi/... URLs, which vercel.json (prod) and next.config (dev) rewrite.
app = FastAPI(
    title="Evangelical Alliance Gather API",
    docs_url="/docs",
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.include_router(churches_api.router)
app.include_router(mps.router)
app.include_router(admin.router)


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
