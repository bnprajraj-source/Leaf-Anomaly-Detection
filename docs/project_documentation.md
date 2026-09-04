# Project Documentation — Leaf Anomaly Detection System

## Overview

This system detects plant leaf diseases using a deep learning pipeline combining:
- **Convolutional Block Attention Module (CBAM)** for spatial and channel feature weighting
- **MAML-based Meta-Learning** for few-shot generalization to new disease classes
- **ResNet-50 Backbone** pretrained on ImageNet

## Architecture

### Model Pipeline

```
Input Image (any size)
       ↓
  Preprocessing
  • RGB conversion
  • Resize to 224×224 (aspect-ratio-preserving padding)
  • ImageNet normalization
       ↓
  ResNet-50 Feature Extractor
  • 50-layer residual network
  • Pretrained weights from ImageNet
  • Output: 2048×7×7 feature map
       ↓
  CBAM Attention Module
  • Channel Attention (reduction ratio 16)
  • Spatial Attention (7×7 kernel)
  • Highlights disease-relevant regions
       ↓
  Global Average Pooling → 2048-dim vector
       ↓
  Dropout (p=0.5)
       ↓
  Linear Classifier → 15 classes
       ↓
  Softmax → Probabilities
```

### Meta-Learning (MAML)

During **meta-training**, each episode simulates a N-way K-shot task:
1. Sample N disease classes, K support images each
2. Inner loop: fine-tune a temporary model copy on support set (5 steps, lr=0.01)
3. Outer loop: evaluate on query set, backprop through inner loop (second-order gradients)

At **inference**, the base model is used directly (no adaptation needed once fine-tuned).

## API Reference

### POST /predict

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| file        | File   | Leaf image (JPEG, PNG, WEBP, BMP)    |

**Response:**

```json
{
  "prediction":          "Diseased",
  "confidence":          94.3,
  "anomaly_type":        "Leaf Spot",
  "all_scores":          { "Healthy": 2.1, "Leaf Spot": 94.3, "..." : "..." },
  "processing_time_ms":  145.2,
  "attention_map_available": true
}
```

### GET /health

```json
{
  "status":      "healthy",
  "model_ready": true,
  "device":      "cpu"
}
```

## Disease Classes

| # | Class               | Description                          |
|---|---------------------|--------------------------------------|
| 0 | Healthy             | No disease detected                  |
| 1 | Leaf Spot           | Circular lesions (fungal/bacterial)  |
| 2 | Powdery Mildew      | White powder coating                 |
| 3 | Rust                | Orange-red pustules                  |
| 4 | Blight              | Rapid tissue death                   |
| 5 | Mosaic Virus        | Yellow-green mosaic pattern          |
| 6 | Leaf Curl           | Curling / distortion                 |
| 7 | Downy Mildew        | Gray/purple underleaf fuzz           |
| 8 | Anthracnose         | Dark sunken lesions                  |
| 9 | Gray Mold           | Botrytis gray mold                   |
|10 | Canker              | Necrotic lesions with margins        |
|11 | Root Rot            | Root-borne symptoms on leaves        |
|12 | Bacterial Wilt      | Wilting, yellowing                   |
|13 | Nutrient Deficiency | Chlorosis / discoloration            |
|14 | Sunscald            | Bleached areas from light exposure   |

## Dataset

Place training images in:
```
backend/dataset/
├── train/
│   ├── Healthy/
│   ├── Leaf_Spot/
│   └── ...
├── test/
└── validation/
```

Recommended: PlantVillage dataset (~54,000 images, 38 classes).

## Training

See `notebooks/model_training.ipynb` for the full training pipeline including:
- Dataset loading and augmentation
- Model initialization
- MAML meta-training loop
- Evaluation metrics
- Checkpoint saving
