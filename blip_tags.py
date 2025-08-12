# blip_tags.py

import sys
import json
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

image_path = sys.argv[1]
image = Image.open(image_path).convert("RGB")

inputs = processor(images=image, return_tensors="pt")
out = model.generate(**inputs, max_length=30)
caption = processor.decode(out[0], skip_special_tokens=True).lower()

labels = [
    "vintage", "boho", "modern", "cute", "cotton", "linen", "denim", "minimalist", "hemp", "bamboo",
    "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "knitted fabric", "pocket", "bag",
    "dress", "skirt", "pants", "leather", "blouse", "bow", "white", "black", "red", "blue", "green", "yellow"
]

matched_tags = [tag for tag in labels if tag in caption]

if matched_tags:
    print(json.dumps(matched_tags))
else:
    print(json.dumps([caption]))
