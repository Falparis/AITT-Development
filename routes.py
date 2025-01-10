from fastapi import APIRouter
from ..services.mistral import generate_text

router = APIRouter()

@router.post("/generate/")
def generate(prompt: str, max_length: int = 200):
    return {"response": generate_text(prompt, max_length)}