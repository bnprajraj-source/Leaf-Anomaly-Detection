"""
Leaf Anomaly Detection — Main Model
=====================================
Assembles the full model: ResNet50 backbone + CBAM attention + classifier.
Provides load_model() and predict() for the inference pipeline.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import torch
import torch.nn as nn
import torchvision.models as tv_models

from app.models.attention_model import CBAM
from app.config import (
    MODEL_PATH, NUM_CLASSES, DEVICE, CLASS_LABELS
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Model Definition
# ---------------------------------------------------------------------------

class LeafAnomalyModel(nn.Module):
    """
    ResNet-50 + CBAM Attention backbone for leaf disease classification.

    Architecture:
        Input (3×224×224)
          → ResNet-50 feature extractor  [2048×7×7]
          → CBAM Attention               [2048×7×7]
          → Global Average Pool          [2048]
          → Dropout(0.5)
          → Linear(2048, num_classes)
          → Softmax (at inference)
    """

    def __init__(self, num_classes: int = NUM_CLASSES, pretrained: bool = True):
        super().__init__()
        weights = tv_models.ResNet50_Weights.DEFAULT if pretrained else None
        backbone = tv_models.resnet50(weights=weights)

        # Strip the final FC + avgpool layers
        self.feature_extractor = nn.Sequential(*list(backbone.children())[:-2])
        self.attention          = CBAM(in_channels=2048, reduction_ratio=16, spatial_kernel=7)
        self.global_avg_pool    = nn.AdaptiveAvgPool2d(1)
        self.dropout            = nn.Dropout(p=0.5)
        self.classifier         = nn.Linear(2048, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feats      = self.feature_extractor(x)        # [B, 2048, 7, 7]
        feats      = self.attention(feats)             # [B, 2048, 7, 7]
        pooled     = self.global_avg_pool(feats)       # [B, 2048, 1, 1]
        flat       = self.dropout(pooled.flatten(1))   # [B, 2048]
        logits     = self.classifier(flat)             # [B, num_classes]
        return logits

    def get_features_and_attention(self, x: torch.Tensor):
        """Returns features and attention maps (for visualization)."""
        feats            = self.feature_extractor(x)
        attended, sp_map = self.attention.get_attention_maps(feats)
        pooled           = self.global_avg_pool(attended)
        logits           = self.classifier(self.dropout(pooled.flatten(1)))
        return logits, sp_map


# ---------------------------------------------------------------------------
# Model Loading
# ---------------------------------------------------------------------------

_model_instance: LeafAnomalyModel | None = None


def _remap_state_dict(state_dict: dict) -> dict:
    """
    Remap state_dict keys from saved model format to current model format.

    Saved model uses:  features.*, fc.*
    Current model uses: feature_extractor.*, classifier.*
    """
    remapped = {}
    for key, value in state_dict.items():
        new_key = key
        if key.startswith("features."):
            new_key = "feature_extractor." + key[len("features."):]
        elif key.startswith("fc."):
            new_key = "classifier." + key[len("fc."):]
        remapped[new_key] = value
    return remapped


def load_model(device: str = DEVICE) -> LeafAnomalyModel:
    """
    Load and return the leaf anomaly model (singleton).

    If a saved checkpoint exists at MODEL_PATH it is loaded;
    otherwise a freshly initialized model (pretrained backbone) is used.
    Automatically remaps state_dict keys from different model formats.
    """
    global _model_instance
    if _model_instance is not None:
        return _model_instance

    model = LeafAnomalyModel(num_classes=NUM_CLASSES, pretrained=True)

    checkpoint_path = Path(MODEL_PATH)
    if checkpoint_path.exists():
        logger.info(f"Loading weights from {checkpoint_path}")
        try:
            state_dict = torch.load(checkpoint_path, map_location=device, weights_only=False)
        except TypeError:
            state_dict = torch.load(checkpoint_path, map_location=device)
        # Support checkpoints saved as {'model_state_dict': ...}
        if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
            state_dict = state_dict["model_state_dict"]
        # Remap keys from saved format to current format
        state_dict = _remap_state_dict(state_dict)
        # Load with strict=False to ignore any unexpected keys
        missing, unexpected = model.load_state_dict(state_dict, strict=False)
        if missing:
            logger.warning(f"Missing keys in model: {missing}")
        if unexpected:
            logger.warning(f"Unexpected keys in model (ignored): {unexpected}")
    else:
        logger.warning(
            f"No saved model found at {checkpoint_path}. "
            "Using pretrained ResNet-50 backbone without fine-tuned weights. "
            "Train the model first for accurate predictions."
        )

    model.to(device)
    model.eval()
    _model_instance = model
    logger.info(f"Model loaded on {device.upper()}")
    return model


# ---------------------------------------------------------------------------
# Inference Helper
# ---------------------------------------------------------------------------

def predict(
    image_tensor: torch.Tensor,
    model:        LeafAnomalyModel,
    device:       str = DEVICE,
) -> Dict[str, Any]:
    """
    Run inference on a single preprocessed image tensor.

    Args:
        image_tensor: Tensor of shape [1, 3, 224, 224].
        model:        Loaded LeafAnomalyModel instance.
        device:       'cpu' or 'cuda'.

    Returns:
        dict with keys: prediction, confidence, anomaly_type,
                        all_scores, attention_map_available.
    """
    image_tensor = image_tensor.to(device)

    with torch.no_grad():
        logits = model(image_tensor)                         # [1, num_classes]
        probs  = torch.softmax(logits, dim=1)[0]             # [num_classes]

    top_idx    = probs.argmax().item()
    confidence = round(probs[top_idx].item() * 100, 2)
    label      = CLASS_LABELS[top_idx]

    return {
        "prediction":            "Healthy" if label == "Healthy" else "Diseased",
        "confidence":            confidence,
        "anomaly_type":          label,
        "all_scores":            {
            CLASS_LABELS[i]: round(probs[i].item() * 100, 2)
            for i in range(len(CLASS_LABELS))
        },
        "attention_map_available": True,
    }


# ---------------------------------------------------------------------------
# Advanced Prediction Utilities
# ---------------------------------------------------------------------------

def predict_with_confidence_threshold(
    image_tensor: torch.Tensor,
    model:        LeafAnomalyModel,
    device:       str = DEVICE,
    threshold:    float = 50.0,
) -> Dict[str, Any]:
    """
    Run inference with a confidence threshold.
    If top prediction confidence is below threshold, returns "Uncertain".

    Args:
        image_tensor: Tensor of shape [1, 3, 224, 224].
        model:        Loaded LeafAnomalyModel instance.
        device:       'cpu' or 'cuda'.
        threshold:    Minimum confidence % to accept prediction.

    Returns:
        dict with prediction, confidence, anomaly_type, all_scores,
        and an 'is_confident' flag.
    """
    result = predict(image_tensor, model, device)
    result["is_confident"] = result["confidence"] >= threshold

    if not result["is_confident"]:
        result["original_prediction"] = result["prediction"]
        result["original_anomaly_type"] = result["anomaly_type"]
        result["prediction"] = "Uncertain"
        result["anomaly_type"] = "Low Confidence"

    return result


def predict_top_n(
    image_tensor: torch.Tensor,
    model:        LeafAnomalyModel,
    device:       str = DEVICE,
    top_n:        int = 3,
) -> Dict[str, Any]:
    """
    Run inference and return the top-N predictions with probabilities.

    Args:
        image_tensor: Tensor of shape [1, 3, 224, 224].
        model:        Loaded LeafAnomalyModel instance.
        device:       'cpu' or 'cuda'.
        top_n:        Number of top predictions to return.

    Returns:
        dict with top_predictions list, primary prediction, and all_scores.
    """
    image_tensor = image_tensor.to(device)

    with torch.no_grad():
        logits = model(image_tensor)
        probs  = torch.softmax(logits, dim=1)[0]

    # Get top-N indices
    top_n = min(top_n, len(CLASS_LABELS))
    top_indices = probs.argsort(descending=True)[:top_n]

    top_predictions = []
    for idx in top_indices:
        top_predictions.append({
            "class": CLASS_LABELS[idx],
            "confidence": round(probs[idx].item() * 100, 2),
            "is_healthy": CLASS_LABELS[idx] == "Healthy",
        })

    primary = top_predictions[0]

    return {
        "prediction": "Healthy" if primary["is_healthy"] else "Diseased",
        "confidence": primary["confidence"],
        "anomaly_type": primary["class"],
        "top_predictions": top_predictions,
        "all_scores": {
            CLASS_LABELS[i]: round(probs[i].item() * 100, 2)
            for i in range(len(CLASS_LABELS))
        },
        "attention_map_available": True,
    }


def predict_ensemble(
    image_tensors: list,
    model:         LeafAnomalyModel,
    device:        str = DEVICE,
) -> Dict[str, Any]:
    """
    Run inference on multiple augmented versions of the same image
    and average the probabilities for more robust predictions.

    Args:
        image_tensors: List of tensors, each [1, 3, 224, 224].
        model:         Loaded LeafAnomalyModel instance.
        device:        'cpu' or 'cuda'.

    Returns:
        dict with averaged prediction results.
    """
    all_probs = []

    for tensor in image_tensors:
        tensor = tensor.to(device)
        with torch.no_grad():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)[0]
            all_probs.append(probs.cpu().numpy())

    # Average probabilities across all augmentations
    avg_probs = np.mean(all_probs, axis=0)
    avg_probs = torch.from_numpy(avg_probs)

    top_idx = avg_probs.argmax().item()
    confidence = round(avg_probs[top_idx].item() * 100, 2)
    label = CLASS_LABELS[top_idx]

    return {
        "prediction": "Healthy" if label == "Healthy" else "Diseased",
        "confidence": confidence,
        "anomaly_type": label,
        "all_scores": {
            CLASS_LABELS[i]: round(avg_probs[i].item() * 100, 2)
            for i in range(len(CLASS_LABELS))
        },
        "num_augmentations": len(image_tensors),
        "attention_map_available": True,
    }
