"""
Image Processing Utilities
===========================
Handles image validation, format conversion, and preparation
for model inference.
"""

import io
import logging
from typing import Tuple

import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Supported image MIME types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """
    Load a PIL Image from raw bytes.

    Raises:
        ValueError: if the bytes cannot be decoded as an image.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()                        # catches truncated files
        img = Image.open(io.BytesIO(image_bytes))   # reopen after verify
        return img
    except (UnidentifiedImageError, Exception) as e:
        raise ValueError(f"Cannot decode image: {e}") from e


def validate_image(image_bytes: bytes, content_type: str) -> None:
    """
    Validate image size and MIME type.

    Raises:
        ValueError: on size or type violations.
    """
    if len(image_bytes) > MAX_FILE_SIZE:
        raise ValueError(
            f"Image exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)} MB."
        )
    if content_type not in ALLOWED_TYPES:
        raise ValueError(
            f"Unsupported image type '{content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_TYPES))}."
        )


def convert_to_rgb(img: Image.Image) -> Image.Image:
    """Ensure image is in RGB mode (converts RGBA, L, P, etc.)."""
    if img.mode != "RGB":
        logger.debug(f"Converting image from mode '{img.mode}' to 'RGB'")
        img = img.convert("RGB")
    return img


def resize_with_padding(
    img:         Image.Image,
    target_size: Tuple[int, int] = (224, 224),
    fill_color:  Tuple[int, int, int] = (0, 0, 0),
) -> Image.Image:
    """
    Resize image to target_size while preserving aspect ratio,
    padding with fill_color where needed.
    """
    img.thumbnail(target_size, Image.LANCZOS)
    padded = Image.new("RGB", target_size, fill_color)
    offset = (
        (target_size[0] - img.width)  // 2,
        (target_size[1] - img.height) // 2,
    )
    padded.paste(img, offset)
    return padded


def image_to_numpy(img: Image.Image) -> np.ndarray:
    """Convert PIL Image to float32 numpy array in [0, 1] range."""
    return np.array(img, dtype=np.float32) / 255.0


def get_image_metadata(img: Image.Image) -> dict:
    """Return basic metadata about an image."""
    return {
        "width":  img.width,
        "height": img.height,
        "mode":   img.mode,
        "format": img.format,
    }
