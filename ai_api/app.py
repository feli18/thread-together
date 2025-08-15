from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from model_clip import predict_tags
# from model_blip import predict_tags
# from model_swin import predict_tags
app = FastAPI(title="AI Tag Generation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Tag Generation API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "AI API is running"}

@app.post("/predict")
async def predict(image: UploadFile = File(...), k: int = 10):
    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    tags = predict_tags(pil_image, top_k=k)
    return {"tags": tags}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
