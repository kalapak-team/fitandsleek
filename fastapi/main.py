from io import BytesIO
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sentence_transformers import SentenceTransformer

app = FastAPI(title="CLIP Vectorizer API")

MODEL_NAME = "sentence-transformers/clip-ViT-B-32"
EXPECTED_DIM = 512

model: SentenceTransformer | None = None


@app.on_event("startup")
def load_model() -> None:
    global model
    model = SentenceTransformer(MODEL_NAME)


@app.post("/vectorize")
async def vectorize_image(image: UploadFile = File(...)) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet")

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    try:
        content = await image.read()
        pil_image = Image.open(BytesIO(content)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {exc}")

    try:
        embedding = model.encode(pil_image)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {exc}")

    vector: List[float] = embedding.tolist()
    if len(vector) != EXPECTED_DIM:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected embedding size: {len(vector)} (expected {EXPECTED_DIM})",
        )

    return {
        "model": MODEL_NAME,
        "dimension": len(vector),
        "vector": vector,
    }
