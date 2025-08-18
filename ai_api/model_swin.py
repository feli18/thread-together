from transformers import AutoFeatureExtractor, SwinModel
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
prototype_path = BASE_DIR / "tag_prototypes.pt"


tag_data = torch.load(prototype_path)
tag_features = tag_data["prototypes"]
labels = tag_data["labels"]


class ProjectionHead(nn.Module):
    def __init__(self, in_dim=768, out_dim=512):
        super().__init__()
        self.fc = nn.Linear(in_dim, out_dim)
        
    def forward(self, x):
        return self.fc(x)

extractor = AutoFeatureExtractor.from_pretrained("microsoft/swin-tiny-patch4-window7-224")
model = SwinModel.from_pretrained("microsoft/swin-tiny-patch4-window7-224")
projection = ProjectionHead(768, tag_features.shape[1]) 
model.eval()
projection.eval()

def predict_tags(image: Image.Image, top_k=10):
    """
    Generate tags using Swin model with improved logic
    """
    try:
        inputs = extractor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            outputs = model(**inputs)
            img_feat = outputs.last_hidden_state.mean(dim=1)
            img_feat = projection(img_feat)  
            img_feat = F.normalize(img_feat, dim=1)

        # Get similarity scores
        sim = torch.matmul(img_feat, tag_features.T)
        
        # Get top-k most similar labels
        topk = torch.topk(sim, k=min(top_k, len(labels)))
        
        # Extract the best matching labels
        best_labels = [labels[i] for i in topk.indices[0]]
        
        # Filter out low-confidence matches (similarity < 0.1)
        confidence_threshold = 0.1
        confident_labels = []
        for i, label in enumerate(best_labels):
            confidence = topk.values[0][i].item()
            if confidence > confidence_threshold:
                confident_labels.append(label)
        
        # If we have enough confident labels, return them
        if len(confident_labels) >= 3:
            return confident_labels[:top_k]
        
        # Otherwise, return the best matches even if confidence is low
        return best_labels[:top_k]
        
    except Exception as e:
        print(f"⚠️  Swin model error: {e}")
        # Fallback to some generic tags
        return ["texture", "pattern", "material", "style", "design"][:top_k]