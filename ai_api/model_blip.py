from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

label_pool = [
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

def predict_tags(pil_image, top_k=10):
    inputs = processor(images=pil_image, return_tensors="pt")
    out = model.generate(**inputs, max_length=30)
    caption = processor.decode(out[0], skip_special_tokens=True).lower()

    print("🧠 BLIP Caption:", caption) 

    # Extract meaningful tags from caption
    matched_tags = []
    
    # First, try to match exact tags from label pool
    for tag in label_pool:
        if f" {tag} " in f" {caption} " or caption.startswith(tag) or caption.endswith(tag):
            matched_tags.append(tag)
    
    # If we have matched tags, return them (limited to top_k)
    if matched_tags:
        return matched_tags[:top_k]
    
    # If no exact matches, extract meaningful words from caption
    # Split caption into words and filter meaningful ones
    words = caption.split()
    meaningful_words = []
    
    # Filter out common stop words and short words
    stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs'}
    
    for word in words:
        # Keep words that are meaningful (not stop words, longer than 2 chars)
        if len(word) > 2 and word.lower() not in stop_words:
            # Clean the word (remove punctuation)
            clean_word = ''.join(c for c in word if c.isalnum())
            if len(clean_word) > 2:
                meaningful_words.append(clean_word)
    
    # Return meaningful words as tags, limited to top_k
    if meaningful_words:
        return meaningful_words[:top_k]
    
    # Fallback: return some generic tags based on image content
    return ["texture", "pattern", "material", "style", "design"][:top_k]
