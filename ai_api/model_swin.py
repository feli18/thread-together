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

def predict_tags(image: Image.Image, top_k=3):
   
    inputs = extractor(images=image, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model(**inputs)
        img_feat = outputs.last_hidden_state.mean(dim=1)
        img_feat = projection(img_feat)  
        img_feat = F.normalize(img_feat, dim=1)

    sim = torch.matmul(img_feat, tag_features.T)  
    topk = torch.topk(sim, k=top_k)
    
    return [labels[i] for i in topk.indices[0]]