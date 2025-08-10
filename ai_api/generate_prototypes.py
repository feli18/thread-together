from transformers import CLIPProcessor, CLIPModel
import torch
import torch.nn.functional as F

MODEL_NAME = "openai/clip-vit-base-patch32"

tag_labels = [
    "vintage", "boho", "modern", "cute", "elegant", "casual", "formal", "preppy", "romantic", "gothic", "streetwear", "chic",
    "cotton", "linen", "denim", "hemp", "bamboo", "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "lace", "tulle", "satin", "velvet",
    "pocket", "button", "zipper", "bow", "ruffle", "collar", "sleeve", "pleats", "embroidery", "lace trim",
    "bag", "dress", "skirt", "pants", "blouse", "jumpsuit", "kimono", "hoodie", "cardigan", "tank top", "blazer",
    "floral", "polka dots", "striped", "plaid", "geometric", "solid color", "abstract",
    "white", "black", "red", "blue", "green", "yellow", "pink", "brown", "gray", "purple", "gold", "silver",
    "patchwork", "hand-sewn", "draping", "upcycled", "smocking", "quilting", "overlock",
    "wedding", "summer", "winter", "vacation", "office wear", "school"
]

tag_phrases = [f"a photo of {tag}" for tag in tag_labels]

clip_model = CLIPModel.from_pretrained(MODEL_NAME)
clip_processor = CLIPProcessor.from_pretrained(MODEL_NAME)

with torch.no_grad():
    inputs = clip_processor(
        text=tag_phrases, 
        return_tensors="pt", 
        padding=True,
        truncation=True
    )
    features = clip_model.get_text_features(**inputs)
    features = F.normalize(features, dim=1)


print(f"Feature dimension: {features.shape[1]}")

torch.save({
    "prototypes": features,
    "labels": tag_labels
}, "tag_prototypes.pt")

print(f"Prototypes saved with shape {features.shape}")


