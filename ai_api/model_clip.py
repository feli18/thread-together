from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image


model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
model.eval()
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
labels = [
    # // Style 
    "vintage", "boho", "modern", "cute", "elegant", "casual", "formal", "preppy", "romantic",
    "gothic", "streetwear", "chic", "minimalist", "cottagecore", "y2k", "retro", "punk", "grunge",
    "sporty", "feminine", "masculine", "unisex",

#   // Material 
    "cotton", "linen", "denim", "hemp", "bamboo", "wool", "silk", "polyester", "nylon", "rayon",
    "acrylic", "lace", "tulle", "satin", "velvet", "leather", "suede", "faux fur", "mesh", "jersey",
    "chiffon", "crepe", "tweed", "corduroy", "flannel", "canvas", "felt", "oilcloth", "batik fabric",
    "terry cloth", "fleece", "upholstery fabric", "pvc fabric",

#   // Technique 
    "pocket", "button", "zipper", "bow", "ruffle", "collar", "sleeve", "pleats", "embroidery", "lace trim",
    "gathering", "dart", "seam", "hem", "topstitch", "bias cut", "princess seam", "raglan sleeve", "set-in sleeve",
    "patchwork quilting", "applique embroidery", "felt applique", "trapunto quilting", "binding edge",


#   // Garment 
    "bag", "dress", "skirt", "pants", "blouse", "jumpsuit", "kimono", "hoodie", "cardigan", "tank top", "blazer",
    "shirt", "jacket", "coat", "vest", "shorts", "leggings", "tights", "socks", "scarf", "hat", "gloves",

#   // Item 
    "tote bag", "crossbody bag", "drawstring bag", "backpack", "pouch", "wallet", "tablet sleeve", "laptop case",
    "water bottle holder", "home decor", "cushion", "pillow", "table runner", "placemat", "coaster",
    "tissue box cover", "fabric basket", "wall hanging", "scrunchie", "headband", "eyeglass case",
    "plush toy", "doll", "puppet", "pet bed", "pet clothes", "pet bandana",
  
#   // Pattern 
    "floral", "polka dots", "striped", "plaid", "geometric", "solid color", "abstract", "animal print", "tie-dye",
    "batik", "ikat", "paisley", "chevron", "herringbone", "houndstooth", "gingham",

#   // Color 
    "white", "black", "red", "blue", "green", "yellow", "pink", "brown", "gray", "purple", "gold", "silver",
    "navy", "teal", "coral", "mint", "lavender", "beige", "cream", "olive", "maroon", "burgundy", "indigo",

#   // Craft 
    "patchwork", "hand-sewn", "draping", "upcycled", "smocking", "quilting", "overlock", "applique", "beading",
    "sequins", "fringe", "tassels", "pom poms", "crochet", "knitting", "macrame",

#   // Occasion 
    "wedding", "summer", "winter", "vacation", "office wear", "school", "party", "beach", "hiking", "running",
    "yoga", "sleepwear", "loungewear", "formal event", "casual day", "picnic", "travel", "gift", "baby shower",
    "home storage", "pet care", "festival decoration", "market tote", "sports", "craft fair",

#   // Fit 
    "loose fit", "tight fit", "oversized", "fitted", "relaxed", "slim fit", "wide leg", "skinny", "straight leg",

#   // Detail 
    "asymmetric", "layered", "tiered", "gathered", "pleated", "ruched", "shirred", "smocked", "quilted",

#   // Feature
    "waterproof", "reversible", "foldable", "insulated", "multi-pocket", "adjustable strap", "lined", "unlined"
  ]

def predict_tags(image: Image.Image, top_k=10):

    image = image.convert("RGB")
    with torch.inference_mode():
        inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
        outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        sorted_labels = sorted(zip(labels, probs), key=lambda x: -x[1])
        return [label for label, _ in sorted_labels[:top_k]]
