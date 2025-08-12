from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量，用于懒加载
_model = None
_processor = None

def get_model_and_processor():
    """懒加载模型和处理器"""
    global _model, _processor
    
    if _model is None or _processor is None:
        try:
            logger.info("正在加载CLIP模型...")
            _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            logger.info("CLIP模型加载完成！")
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            raise
    
    return _model, _processor

# 标签池
labels = [
    "vintage", "boho", "modern", "cute", "elegant", "casual", "formal", "preppy", "romantic", "gothic", "streetwear", "chic",
    "cotton", "linen", "denim", "hemp", "bamboo", "wool", "silk", "polyester", "nylon", "rayon", "acrylic", "lace", "tulle", "satin", "velvet",
    "pocket", "button", "zipper", "bow", "ruffle", "collar", "sleeve", "pleats", "embroidery", "lace trim",
    "bag", "dress", "skirt", "pants", "blouse", "jumpsuit", "kimono", "hoodie", "cardigan", "tank top", "blazer",
    "floral", "polka dots", "striped", "plaid", "geometric", "solid color", "abstract",
    "white", "black", "red", "blue", "green", "yellow", "pink", "brown", "gray", "purple", "gold", "silver",
    "patchwork", "hand-sewn", "draping", "upcycled", "smocking", "quilting", "overlock",
    "wedding", "summer", "winter", "vacation", "office wear", "school"
]

def predict_tags(image: Image.Image, top_k=3):
    """预测图片标签"""
    try:
        # 懒加载模型
        model, processor = get_model_and_processor()
        
        # 处理输入
        inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)
        
        # 推理
        with torch.no_grad():  # 不计算梯度，节省内存
            outputs = model(**inputs)
        
        # 计算概率
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        sorted_labels = sorted(zip(labels, probs), key=lambda x: -x[1])
        
        # 返回top_k标签
        result = [label for label, _ in sorted_labels[:top_k]]
        logger.info(f"预测标签: {result}")
        return result
        
    except Exception as e:
        logger.error(f"预测失败: {e}")
        return ["error: prediction failed"]
