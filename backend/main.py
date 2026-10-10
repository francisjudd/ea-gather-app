from fastapi import FastAPI
import admin
import churches as churches_api
import mps

# Vercel strips /openapi before forwarding; root_path keeps generated URLs public.
app = FastAPI(
    title="Evangelical Alliance Gather API",
    root_path="/openapi",
)

app.include_router(churches_api.router)
app.include_router(mps.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}
