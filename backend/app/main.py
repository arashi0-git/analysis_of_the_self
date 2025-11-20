from fastapi import FastAPI

app = FastAPI(title="Analysis of the Self API")


@app.get("/")
def read_root():
    return {"message": "Hello World from FastAPI"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
