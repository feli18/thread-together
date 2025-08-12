from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Tag Generator Service is running!"}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    # 模拟AI标签生成，不依赖实际模型
    contents = await image.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 返回模拟标签
    mock_tags = ["test-tag-1", "test-tag-2", "test-tag-3"]
    return {"tags": mock_tags, "message": "This is a test response - AI model not loaded"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Tag Generator"}
