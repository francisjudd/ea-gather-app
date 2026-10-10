from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Evangelical Alliance Gather API is running"}