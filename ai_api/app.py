from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from model_clip import predict_tags as predict_tags_clip
from model_blip import predict_tags as predict_tags_blip
from model_swin import predict_tags as predict_tags_swin
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
async def predict(image: UploadFile = File(...), k: int = 10, model: str = Form("clip")):
    try:
        contents = await image.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        print(f"🔍 Processing with model: {model.lower()}, k: {k}")
        
        # Select model based on parameter
        if model.lower() == "blip":
            print("🧠 Using BLIP model...")
            tags = predict_tags_blip(pil_image, top_k=k)
        elif model.lower() == "swin":
            print("🧠 Using Swin model...")
            tags = predict_tags_swin(pil_image, top_k=k)
        else:  # default to clip
            print("🧠 Using CLIP model...")
            tags = predict_tags_clip(pil_image, top_k=k)
        
        print(f"✅ Generated {len(tags)} tags: {tags}")
        return {"tags": tags, "model": model.lower()}
        
    except Exception as e:
        print(f"❌ Error in predict: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "model": model.lower()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
