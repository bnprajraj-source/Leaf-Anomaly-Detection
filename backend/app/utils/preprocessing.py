"""
Preprocessing Pipeline
========================
Converts a PIL image into a normalized PyTorch tensor
ready for model inference.
"""

import logging
from typing import Tuple

import numpy as np
import torch
from PIL import Image

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
