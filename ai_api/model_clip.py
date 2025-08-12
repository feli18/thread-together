from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image


model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
labels = ["vintage", "boho", "modern", "cute", "elegant", "casual", "formal", "preppy", "romantic", "gothic", "streetwear", "chic",

    "cotton", "linen", "denim", "hemp", "bamboo", "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "lace", "tulle", "satin", "velvet",

    "pocket", "button", "zipper", "bow", "ruffle", "collar", "sleeve", "pleats", "embroidery", "lace trim",

    "bag", "dress", "skirt", "pants", "blouse", "jumpsuit", "kimono", "hoodie", "cardigan", "tank top", "blazer",

    "floral", "polka dots", "striped", "plaid", "geometric", "solid color", "abstract",

    "white", "black", "red", "blue", "green", "yellow", "pink", "brown", "gray", "purple", "gold", "silver",

    "patchwork", "hand-sewn", "draping", "upcycled", "smocking", "quilting", "overlock",

    "wedding", "summer", "winter", "vacation", "office wear", "school"]

def predict_tags(image: Image.Image, top_k=3):
    # 保障输入为RGB
    image = image.convert("RGB")
    with torch.inference_mode():
        inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        sorted_labels = sorted(zip(labels, probs), key=lambda x: -x[1])
        return [label for label, _ in sorted_labels[:top_k]]
