from fastapi import FastAPI

# Services preserve the public request path, including /openapi.
app = FastAPI(
    docs_url="/openapi/docs",
    swagger_ui_oauth2_redirect_url="/openapi/docs/oauth2-redirect",
    redoc_url="/openapi/redoc",
    openapi_url="/openapi/openapi.json",
)


@app.get("/")
@app.get("/openapi")
@app.get("/openapi/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}
