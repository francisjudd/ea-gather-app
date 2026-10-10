from datetime import datetime, timezone
import secrets

from fastapi import FastAPI
from fastapi import HTTPException

from pydantic import BaseModel

import admin
import churches as churches_api
import mps

# vercel.json routes /openapi/* to this service, forwarding the full /openapi
# path. The frontend always calls same-origin /openapi/... URLs, which
# vercel.json (prod) and next.config (dev) rewrite.
app = FastAPI(
    title="Evangelical Alliance Gather API",
    docs_url="/openapi/docs",
    swagger_ui_oauth2_redirect_url="/openapi/docs/oauth2-redirect",
    redoc_url="/openapi/redoc",
    openapi_url="/openapi/openapi.json",
)

app.include_router(churches_api.router, prefix='/openapi')
app.include_router(mps.router, prefix='/openapi')
app.include_router(admin.router, prefix='/openapi')


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
