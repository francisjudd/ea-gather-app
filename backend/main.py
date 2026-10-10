from fastapi import FastAPI

# Services preserve the public request path, including /backend.
app = FastAPI(
    docs_url="/backend/docs",
    swagger_ui_oauth2_redirect_url="/backend/docs/oauth2-redirect",
    redoc_url="/backend/redoc",
    openapi_url="/backend/openapi.json",
)


@app.get("/")
@app.get("/backend")
@app.get("/backend/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}
