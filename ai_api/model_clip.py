from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image

# 初始化模型（只加载一次）
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
labels = ["vintage", "boho", "modern", "cute", "cotton", "linen", "denim", "minimalist"]

def predict_tags(image: Image.Image, top_k=3):
    inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
    outputs = model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)[0]
    sorted_labels = sorted(zip(labels, probs), key=lambda x: -x[1])
    return [label for label, _ in sorted_labels[:top_k]]
