# blip_tags.py

import sys
import json
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

# 加载模型
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# 图像路径
image_path = sys.argv[1]
image = Image.open(image_path).convert("RGB")

# 生成描述文本
inputs = processor(images=image, return_tensors="pt")
out = model.generate(**inputs, max_length=30)
caption = processor.decode(out[0], skip_special_tokens=True).lower()

# 标签池
labels = [
    "vintage", "boho", "modern", "cute", "cotton", "linen", "denim", "minimalist", "hemp", "bamboo",
    "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "knitted fabric", "pocket", "bag",
    "dress", "skirt", "pants", "leather", "blouse", "bow", "white", "black", "red", "blue", "green", "yellow"
]

# 提取匹配的标签
matched_tags = [tag for tag in labels if tag in caption]

# 若无匹配，则返回完整描述（可选）
if matched_tags:
    print(json.dumps(matched_tags))
else:
    print(json.dumps([caption]))
