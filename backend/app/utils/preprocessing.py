"""
Preprocessing Pipeline
=======================
Converts a PIL image into a normalized PyTorch tensor
ready for model inference. Includes data augmentation utilities.
"""

import logging
import random
from typing import Tuple, List

import numpy as np
import torch
from PIL import Image, ImageOps

from app.config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD
from app.utils.image_processing import (
    convert_to_rgb,
    resize_with_padding,
)

logger = logging.getLogger(__name__)


def normalize(array: np.ndarray, mean: list, std: list) -> np.ndarray:
    """
    Normalize a float32 HWC array channel-wise.

    Args:
        array: shape [H, W, 3], values in [0, 1].
        mean:  per-channel mean list of length 3.
        std:   per-channel std  list of length 3.

    Returns:
        Normalized array of same shape and dtype.
    """
    mean_arr = np.array(mean, dtype=np.float32).reshape(1, 1, 3)
    std_arr  = np.array(std,  dtype=np.float32).reshape(1, 1, 3)
    return (array - mean_arr) / std_arr


def preprocess_image(
    img:         Image.Image,
    target_size: Tuple[int, int] = IMAGE_SIZE,
    mean:        list = IMAGENET_MEAN,
    std:         list = IMAGENET_STD,
) -> torch.Tensor:
    """
    Full preprocessing pipeline: RGB → resize → normalize → tensor.

    Args:
        img:         Raw PIL image (any mode).
        target_size: (width, height) to resize to.
        mean:        Channel-wise mean for normalization.
        std:         Channel-wise std  for normalization.

    Returns:
        Float32 tensor of shape [1, 3, H, W].
    """
    # 1. Ensure RGB
    img = convert_to_rgb(img)

    # 2. Resize with aspect-ratio-preserving padding
    img = resize_with_padding(img, target_size)

    # 3. To numpy float32 [0, 1]
    array = np.array(img, dtype=np.float32) / 255.0

    # 4. Normalize (ImageNet stats by default)
    array = normalize(array, mean, std)

    # 5. HWC → CHW, add batch dimension
    tensor = torch.from_numpy(array).permute(2, 0, 1).unsqueeze(0)  # [1, 3, H, W]

    logger.debug(f"Preprocessed tensor shape: {tensor.shape}, dtype: {tensor.dtype}")
    return tensor


def batch_preprocess(
    images:      list,
    target_size: Tuple[int, int] = IMAGE_SIZE,
) -> torch.Tensor:
    """
    Preprocess a list of PIL images into a batched tensor.

    Returns:
        Tensor of shape [N, 3, H, W].
    """
    tensors = [preprocess_image(img, target_size).squeeze(0) for img in images]
    return torch.stack(tensors)


# ---------------------------------------------------------------------------
# Data Augmentation Utilities
# ---------------------------------------------------------------------------

def augment_rotate(img: Image.Image, max_angle: float = 30.0) -> Image.Image:
    """
    Randomly rotate an image within [-max_angle, max_angle] degrees.

    Args:
        img:       PIL Image to rotate.
        max_angle: Maximum rotation angle in degrees.

    Returns:
        Rotated PIL Image.
    """
    angle = random.uniform(-max_angle, max_angle)
    return img.rotate(angle, resample=Image.BICUBIC, fillcolor=(0, 0, 0))


def augment_flip_horizontal(img: Image.Image) -> Image.Image:
    """Randomly flip image horizontally with 50% probability."""
    if random.random() > 0.5:
        return ImageOps.mirror(img)
    return img


def augment_flip_vertical(img: Image.Image) -> Image.Image:
    """Randomly flip image vertically with 50% probability."""
    if random.random() > 0.5:
        return ImageOps.flip(img)
    return img


def augment_brightness(img: Image.Image, factor_range: Tuple[float, float] = (0.7, 1.3)) -> Image.Image:
    """
    Randomly adjust brightness within a range.

    Args:
        img:          PIL Image to adjust.
        factor_range: (min, max) brightness factor range.

    Returns:
        Brightness-adjusted PIL Image.
    """
    from PIL import ImageEnhance
    factor = random.uniform(*factor_range)
    return ImageEnhance.Brightness(img).enhance(factor)


def augment_contrast(img: Image.Image, factor_range: Tuple[float, float] = (0.7, 1.3)) -> Image.Image:
    """
    Randomly adjust contrast within a range.

    Args:
        img:          PIL Image to adjust.
        factor_range: (min, max) contrast factor range.

    Returns:
        Contrast-adjusted PIL Image.
    """
    from PIL import ImageEnhance
    factor = random.uniform(*factor_range)
    return ImageEnhance.Contrast(img).enhance(factor)


def augment_saturation(img: Image.Image, factor_range: Tuple[float, float] = (0.7, 1.3)) -> Image.Image:
    """
    Randomly adjust color saturation within a range.

    Args:
        img:          PIL Image to adjust.
        factor_range: (min, max) saturation factor range.

    Returns:
        Saturation-adjusted PIL Image.
    """
    from PIL import ImageEnhance
    factor = random.uniform(*factor_range)
    return ImageEnhance.Color(img).enhance(factor)


def augment_crop(img: Image.Image, crop_ratio: float = 0.8) -> Image.Image:
    """
    Randomly crop and resize an image.

    Args:
        img:        PIL Image to crop.
        crop_ratio: Fraction of the image to keep (0.0-1.0).

    Returns:
        Cropped and resized PIL Image.
    """
    w, h = img.size
    new_w = int(w * crop_ratio)
    new_h = int(h * crop_ratio)

    left = random.randint(0, w - new_w)
    top = random.randint(0, h - new_h)
    right = left + new_w
    bottom = top + new_h

    cropped = img.crop((left, top, right, bottom))
    return cropped.resize((w, h), Image.BICUBIC)


def augment_noise(img: Image.Image, std: float = 10.0) -> Image.Image:
    """
    Add Gaussian noise to an image.

    Args:
        img: PIL Image to add noise to.
        std: Standard deviation of the noise.

    Returns:
        Noisy PIL Image.
    """
    array = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, std, array.shape)
    noisy = np.clip(array + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(noisy)


def augment_random(img: Image.Image, num_augmentations: int = 5) -> List[Image.Image]:
    """
    Apply a random combination of augmentations to generate multiple variants.

    Args:
        img:                 PIL Image to augment.
        num_augmentations:   Number of augmented versions to generate.

    Returns:
        List of augmented PIL Images.
    """
    augmented = []
    for _ in range(num_augmentations):
        aug_img = img.copy()

        # Randomly apply a subset of augmentations
        if random.random() > 0.5:
            aug_img = augment_rotate(aug_img, max_angle=20.0)
        if random.random() > 0.5:
            aug_img = augment_flip_horizontal(aug_img)
        if random.random() > 0.5:
            aug_img = augment_brightness(aug_img, factor_range=(0.8, 1.2))
        if random.random() > 0.5:
            aug_img = augment_contrast(aug_img, factor_range=(0.8, 1.2))
        if random.random() > 0.5:
            aug_img = augment_saturation(aug_img, factor_range=(0.8, 1.2))
        if random.random() > 0.6:
            aug_img = augment_crop(aug_img, crop_ratio=0.85)
        if random.random() > 0.7:
            aug_img = augment_noise(aug_img, std=5.0)

        augmented.append(aug_img)

    return augmented


def augment_for_prediction(img: Image.Image, num_augmentations: int = 3) -> List[torch.Tensor]:
    """
    Generate augmented versions of an image and preprocess them for ensemble prediction.
    Uses lighter augmentations to avoid distorting the image too much.

    Args:
        img:                PIL Image to augment.
        num_augmentations:  Number of augmented versions.

    Returns:
        List of preprocessed tensors ready for model inference.
    """
    augmented_images = augment_random(img, num_augmentations)
    # Always include the original
    all_images = [img] + augmented_images
    return [preprocess_image(augmented) for augmented in all_images]


def compute_augmentation_stats(img: Image.Image, num_samples: int = 20) -> dict:
    """
    Compute statistics about how augmentations affect the image.
    Useful for understanding augmentation impact.

    Args:
        img:         PIL Image to test augmentations on.
        num_samples: Number of random augmentations to test.

    Returns:
        dict with statistics about augmentation effects.
    """
    augmented = augment_random(img, num_samples)

    sizes = [(a.width, a.height) for a in augmented]
    modes = [a.mode for a in augmented]

    return {
        "num_augmentations": num_samples,
        "original_size": (img.width, img.height),
        "unique_sizes": list(set(sizes)),
        "unique_modes": list(set(modes)),
        "all_same_size": len(set(sizes)) == 1,
        "all_same_mode": len(set(modes)) == 1,
    }
