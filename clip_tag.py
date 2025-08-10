import sys
import json
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel


labels = [
    "vintage", "boho", "modern", "cute", "cotton", "linen", "denim", "minimalist", "hemp", "bamboo",
    "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "knitted fabric", "pocket", "bag",
    "dress", "skirt", "pants", "leather", "blouse", "bow", "white", "black", "red", "blue", "green", "yellow"
]

model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

image_path = sys.argv[1]
image = Image.open(image_path).convert("RGB")

inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
outputs = model(**inputs)
probs = outputs.logits_per_image.softmax(dim=1)[0]  # shape: (labels_len,)

sorted_tags = sorted(zip(labels, probs), key=lambda x: -x[1])
top_tags = [label for label, prob in sorted_tags[:3]]


print(json.dumps(top_tags))
