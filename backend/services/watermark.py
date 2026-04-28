"""
Service handling watermark operations.
"""

from imwatermark import WatermarkEncoder, WatermarkDecoder
import numpy as np
import cv2
from PIL import Image
import io
import uuid
import os
import logging

logger = logging.getLogger(__name__)

class WatermarkService:
    def generate_payload(self, asset_id: str) -> str:
        clean_id = asset_id.replace('-', '')
        payload = clean_id[:16].lower()
        if len(payload) < 16:
            payload = payload.zfill(16)
        return payload

    def embed_watermark(self, image_bytes: bytes, payload: str) -> bytes:
        logger.info(f"embed_watermark: Starting with payload {payload}")
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            bgr_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            try:
                encoder = WatermarkEncoder()
                encoder.set_watermark('bytes', payload.encode('utf-8'))
                watermarked_bgr = encoder.encode(bgr_image, 'rivaGan')
            except Exception as e:
                logger.warning(f"rivaGan encoding failed: {e}. Falling back to dwtDct.")
                encoder = WatermarkEncoder()
                encoder.set_watermark('bytes', payload.encode('utf-8'))
                watermarked_bgr = encoder.encode(bgr_image, 'dwtDct')

            watermarked_rgb = cv2.cvtColor(watermarked_bgr, cv2.COLOR_BGR2RGB)
            watermarked_image = Image.fromarray(watermarked_rgb)

            output_buffer = io.BytesIO()
            watermarked_image.save(output_buffer, format="JPEG", quality=95)
            logger.info("embed_watermark: Success")
            return output_buffer.getvalue()
        except Exception as e:
            logger.error(f"embed_watermark: Failed to embed watermark - {str(e)}")
            return image_bytes

    def extract_watermark(self, image_bytes: bytes) -> str | None:
        logger.info("extract_watermark: Starting extraction")
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            bgr_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            decoder = WatermarkDecoder('bytes', 16 * 8)
            
            try:
                watermark = decoder.decode(bgr_image, 'rivaGan')
            except Exception as e:
                watermark = decoder.decode(bgr_image, 'dwtDct')

            decoded_payload = watermark.decode('utf-8', errors='ignore')
            logger.info(f"extract_watermark: Successfully extracted payload {decoded_payload}")
            return decoded_payload
        except Exception as e:
            logger.error(f"extract_watermark: Failed to extract watermark - {str(e)}")
            return None

    def verify_watermark(self, image_bytes: bytes, expected_payload: str) -> bool:
        extracted = self.extract_watermark(image_bytes)
        return extracted == expected_payload

watermark_service = WatermarkService()
