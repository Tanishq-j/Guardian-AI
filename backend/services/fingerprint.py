"""
Service handling image fingerprint operations.
"""

from google.cloud import vision
import imagehash
from PIL import Image
import io
import json
import numpy as np
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class FingerprintService:
    def compute_phash(self, image_bytes: bytes) -> str:
        logger.info("compute_phash: Starting pHash computation")
        image = Image.open(io.BytesIO(image_bytes))
        hash_val = imagehash.dhash(image)
        logger.info("compute_phash: Success")
        return str(hash_val)

    def compute_vision_fingerprint(self, image_bytes: bytes) -> dict:
        logger.info("compute_vision_fingerprint: Starting Vision API analysis")
        fallback_response = {
            "labels": [],
            "dominant_colors": [],
            "web_entities": [],
            "fingerprint_vector": [0.0] * 25
        }
        try:
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_bytes)
            
            features = [
                vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=20),
                vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES),
                vision.Feature(type_=vision.Feature.Type.WEB_DETECTION)
            ]
            
            request = vision.AnnotateImageRequest(image=image, features=features)
            response = client.annotate_image(request)
            
            if response.error.message:
                raise Exception(response.error.message)

            labels = [{"description": label.description, "score": label.score} 
                      for label in response.label_annotations if label.score > 0.5][:15]
            
            colors = []
            if response.image_properties_annotation and response.image_properties_annotation.dominant_colors:
                colors = [{"red": int(color_info.color.red), "green": int(color_info.color.green), 
                           "blue": int(color_info.color.blue), "score": color_info.score}
                          for color_info in response.image_properties_annotation.dominant_colors.colors][:5]
            
            web_entities = []
            if response.web_detection and response.web_detection.web_entities:
                web_entities = [{"description": entity.description, "score": entity.score} 
                                for entity in response.web_detection.web_entities][:10]

            fingerprint_vector = []
            
            for i in range(15):
                fingerprint_vector.append(labels[i]["score"] if i < len(labels) else 0.0)
            
            for i in range(5):
                fingerprint_vector.append(colors[i]["score"] if i < len(colors) else 0.0)
                
            for i in range(5):
                fingerprint_vector.append(web_entities[i]["score"] if i < len(web_entities) else 0.0)

            result = {
                "labels": labels,
                "dominant_colors": colors,
                "web_entities": web_entities,
                "fingerprint_vector": fingerprint_vector
            }
            logger.info("compute_vision_fingerprint: Success")
            return result
        except Exception as e:
            logger.error(f"compute_vision_fingerprint: Failed - {str(e)}")
            return fallback_response

    def compute_fingerprint_similarity(self, fp1: dict, fp2: dict) -> float:
        vec1 = np.array(fp1.get("fingerprint_vector", [0.0]*25))
        vec2 = np.array(fp2.get("fingerprint_vector", [0.0]*25))
        
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(np.dot(vec1, vec2) / (norm1 * norm2))

    def compute_full_fingerprint(self, image_bytes: bytes) -> dict:
        logger.info("compute_full_fingerprint: Starting full computation")
        phash = self.compute_phash(image_bytes)
        vision_fp = self.compute_vision_fingerprint(image_bytes)
        return {
            "phash": phash,
            "vision": vision_fp,
            "computed_at": datetime.now(timezone.utc).isoformat()
        }

fingerprint_service = FingerprintService()
