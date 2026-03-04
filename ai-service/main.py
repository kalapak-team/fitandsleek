from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sentence_transformers import SentenceTransformer

app = FastAPI(title="AI Vectorization Service")

MODEL_NAME = "clip-ViT-B-32"
EXPECTED_DIMENSION = 512

model: SentenceTransformer | None = None


@app.on_event("startup")
def on_startup() -> None:
    global model
    model = SentenceTransformer(MODEL_NAME)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": MODEL_NAME}


@app.post("/vectorize")
async def vectorize(image: UploadFile = File(...)) -> dict:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    try:
        payload = await image.read()
        pil_image = Image.open(BytesIO(payload)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image format")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read image: {exc}")

    try:
        vector = model.encode(pil_image).tolist()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {exc}")

    if len(vector) != EXPECTED_DIMENSION:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid vector size {len(vector)}, expected {EXPECTED_DIMENSION}",
        )

    return {
        "dimension": len(vector),
        "vector": [float(v) for v in vector],
    }
