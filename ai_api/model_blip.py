from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

label_pool = [
    "vintage", "boho", "modern", "cute", "elegant", "casual", "formal", "preppy", "romantic", "gothic", "streetwear", "chic",

    "cotton", "linen", "denim", "hemp", "bamboo", "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "lace", "tulle", "satin", "velvet",

    "pocket", "button", "zipper", "bow", "ruffle", "collar", "sleeve", "pleats", "embroidery", "lace trim",

    "bag", "dress", "skirt", "pants", "blouse", "jumpsuit", "kimono", "hoodie", "cardigan", "tank top", "blazer",

    "floral", "polka dots", "striped", "plaid", "geometric", "solid color", "abstract",

    "white", "black", "red", "blue", "green", "yellow", "pink", "brown", "gray", "purple", "gold", "silver",

    "patchwork", "hand-sewn", "draping", "upcycled", "smocking", "quilting", "overlock",

    "wedding", "summer", "winter", "vacation", "office wear", "school"
]

def predict_tags(pil_image):
    inputs = processor(images=pil_image, return_tensors="pt")
    out = model.generate(**inputs, max_length=30)
    caption = processor.decode(out[0], skip_special_tokens=True).lower()

    # print("🧠 BLIP Caption:", caption) 

  
    matched_tags = []
    for tag in label_pool:
        if f" {tag} " in f" {caption} " or caption.startswith(tag) or caption.endswith(tag):
            matched_tags.append(tag)

    return matched_tags if matched_tags else [f"(caption) {caption}"]
