from fastapi import FastAPI

import admin
import churches
import mps

# Services preserve the public request path, including /openapi.
app = FastAPI(
    title="Evangelical Alliance Gather API",
    docs_url="/openapi/docs",
    swagger_ui_oauth2_redirect_url="/openapi/docs/oauth2-redirect",
    redoc_url="/openapi/redoc",
    openapi_url="/openapi/openapi.json",
)

app.include_router(churches.router, prefix="/openapi")
app.include_router(mps.router, prefix="/openapi")
app.include_router(admin.router, prefix="/openapi")


@app.get("/")
@app.get("/openapi")
@app.get("/openapi/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}
