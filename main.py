from fastapi import FastAPI
from .routes import router

app = FastAPI(title="Mistral AI API", version="1.0")
app.include_router(router)

@app.get("/")
def home():
    return {"message": "Bienvenue sur l'API Mistral AI"}