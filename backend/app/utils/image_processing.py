"""
Image Processing Utilities
==========================
Handles image validation, format conversion, and preparation
for model inference.
"""

import io
import logging
from typing import Tuple

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, UnidentifiedImageError

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


# ---------------------------------------------------------------------------
# Image Enhancement Utilities
# ---------------------------------------------------------------------------

def enhance_brightness(img: Image.Image, factor: float = 1.0) -> Image.Image:
    """
    Adjust image brightness.

    Args:
        img:    PIL Image to enhance.
        factor: 1.0 = no change, <1.0 = darker, >1.0 = brighter.

    Returns:
        Enhanced PIL Image.
    """
    enhancer = ImageEnhance.Brightness(img)
    return enhancer.enhance(factor)


def enhance_contrast(img: Image.Image, factor: float = 1.0) -> Image.Image:
    """
    Adjust image contrast.

    Args:
        img:    PIL Image to enhance.
        factor: 1.0 = no change, <1.0 = less contrast, >1.0 = more contrast.

    Returns:
        Enhanced PIL Image.
    """
    enhancer = ImageEnhance.Contrast(img)
    return enhancer.enhance(factor)


def enhance_sharpness(img: Image.Image, factor: float = 1.0) -> Image.Image:
    """
    Adjust image sharpness.

    Args:
        img:    PIL Image to enhance.
        factor: 1.0 = no change, 0.0 = blurry, >1.0 = sharper.

    Returns:
        Enhanced PIL Image.
    """
    enhancer = ImageEnhance.Sharpness(img)
    return enhancer.enhance(factor)


def enhance_color(img: Image.Image, factor: float = 1.0) -> Image.Image:
    """
    Adjust image color saturation.

    Args:
        img:    PIL Image to enhance.
        factor: 1.0 = no change, 0.0 = grayscale, >1.0 = more saturated.

    Returns:
        Enhanced PIL Image.
    """
    enhancer = ImageEnhance.Color(img)
    return enhancer.enhance(factor)


def apply_gaussian_blur(img: Image.Image, radius: float = 2.0) -> Image.Image:
    """
    Apply Gaussian blur to an image.

    Args:
        img:    PIL Image to blur.
        radius: Blur radius (higher = more blur).

    Returns:
        Blurred PIL Image.
    """
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def apply_sharpen(img: Image.Image) -> Image.Image:
    """Apply sharpening filter to an image."""
    return img.filter(ImageFilter.SHARPEN)


def reduce_noise(img: Image.Image) -> Image.Image:
    """
    Reduce image noise using a median filter.
    Effective for salt-and-pepper noise.
    """
    return img.filter(ImageFilter.MedianFilter(size=3))


def adjust_gamma(img: Image.Image, gamma: float = 1.0) -> Image.Image:
    """
    Apply gamma correction to an image.

    Args:
        img:   PIL Image to adjust.
        gamma: <1.0 = brighter, >1.0 = darker.

    Returns:
        Gamma-corrected PIL Image.
    """
    array = np.array(img, dtype=np.float32) / 255.0
    corrected = np.power(array, 1.0 / gamma)
    corrected = (corrected * 255).clip(0, 255).astype(np.uint8)
    return Image.fromarray(corrected)


def auto_enhance(img: Image.Image) -> Image.Image:
    """
    Automatically enhance an image with balanced brightness, contrast, and sharpness.
    Useful as a preprocessing step to improve prediction accuracy.
    """
    img = enhance_brightness(img, factor=1.1)
    img = enhance_contrast(img, factor=1.2)
    img = enhance_sharpness(img, factor=1.1)
    return img


def get_image_stats(img: Image.Image) -> dict:
    """
    Compute basic image statistics useful for quality assessment.

    Returns:
        dict with mean, std, min, max for each channel.
    """
    array = np.array(img, dtype=np.float32) / 255.0
    channels = ["R", "G", "B"]
    stats = {}
    for i, ch in enumerate(channels):
        channel_data = array[:, :, i]
        stats[ch] = {
            "mean": round(float(channel_data.mean()), 4),
            "std": round(float(channel_data.std()), 4),
            "min": round(float(channel_data.min()), 4),
            "max": round(float(channel_data.max()), 4),
        }
    return stats
