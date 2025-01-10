from ..services.embeddings import retrieve_context
from ..services.mistral import generate_text

def generate_with_rag(prompt, max_length=200):
    context = retrieve_context(prompt)
    full_prompt = f"Context: {context} \n Question: {prompt}"
    return generate_text(full_prompt, max_length)