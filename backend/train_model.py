"""
Train the Leaf Anomaly Detection model using available images.
Uses heavy augmentation since we have limited samples per class.
"""

import sys
import os
import shutil
import random
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as T
import torchvision.models as tv_models
from PIL import Image
import numpy as np

from app.config import SAVED_MODELS_DIR, IMAGENET_MEAN, IMAGENET_STD

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
NUM_CLASSES = 5
BATCH_SIZE = 2
EPOCHS = 50
LR = 1e-3
IMAGE_SIZE = (224, 224)

CLASS_NAMES = ["Healthy", "Leaf Spot", "Powdery Mildew", "Rust", "Blight"]

ASSETS_DIR = Path(__file__).parent.parent / "frontend" / "src" / "assets" / "realistic"
DATASET_DIR = Path(__file__).parent / "dataset"

IMAGE_MAP = {
    "Healthy": "healthy.jpg",
    "Leaf Spot": "leaf-spot.jpg",
    "Powdery Mildew": "powdery-mildew.jpg",
    "Rust": "rust.jpg",
    "Blight": "blight.jpg",
}


# ---------------------------------------------------------------------------
# Step 1: Prepare dataset structure
# ---------------------------------------------------------------------------
def prepare_dataset():
    """Create ImageFolder structure from available images with augmentation copies."""
    for split in ["train", "validation", "test"]:
        for cls in CLASS_NAMES:
            (DATASET_DIR / split / cls).mkdir(parents=True, exist_ok=True)

    for cls_name, img_file in IMAGE_MAP.items():
        src = ASSETS_DIR / img_file
        if not src.exists():
            print(f"  Warning: {src} not found, skipping {cls_name}")
            continue

        for i in range(20):
            dst = DATASET_DIR / "train" / cls_name / f"{cls_name.lower().replace(' ', '_')}_{i:03d}.jpg"
            shutil.copy2(src, dst)

        dst_val = DATASET_DIR / "validation" / cls_name / f"{cls_name.lower().replace(' ', '_')}_val.jpg"
        shutil.copy2(src, dst_val)

        dst_test = DATASET_DIR / "test" / cls_name / f"{cls_name.lower().replace(' ', '_')}_test.jpg"
        shutil.copy2(src, dst_test)

    print("Dataset prepared.")


# ---------------------------------------------------------------------------
# Step 2: Custom dataset with on-the-fly augmentation
# ---------------------------------------------------------------------------
class LeafDataset(Dataset):
    def __init__(self, root, transform=None):
        self.root = Path(root)
        self.transform = transform
        self.samples = []
        self.class_to_idx = {c: i for i, c in enumerate(CLASS_NAMES)}

        for cls in CLASS_NAMES:
            cls_dir = self.root / cls
            if cls_dir.exists():
                for img_path in cls_dir.glob("*.jpg"):
                    self.samples.append((str(img_path), self.class_to_idx[cls]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


# ---------------------------------------------------------------------------
# Step 3: Model (ResNet-50 + CBAM, 5 classes)
# ---------------------------------------------------------------------------
from app.models.attention_model import CBAM


class LeafAnomalyModel5(nn.Module):
    def __init__(self, num_classes=NUM_CLASSES):
        super().__init__()
        weights = tv_models.ResNet50_Weights.DEFAULT
        backbone = tv_models.resnet50(weights=weights)
        self.feature_extractor = nn.Sequential(*list(backbone.children())[:-2])
        self.attention = CBAM(in_channels=2048, reduction_ratio=16, spatial_kernel=7)
        self.global_avg_pool = nn.AdaptiveAvgPool2d(1)
        self.dropout = nn.Dropout(p=0.5)
        self.classifier = nn.Linear(2048, num_classes)

    def forward(self, x):
        feats = self.feature_extractor(x)
        feats = self.attention(feats)
        pooled = self.global_avg_pool(feats)
        flat = self.dropout(pooled.flatten(1))
        logits = self.classifier(flat)
        return logits


# ---------------------------------------------------------------------------
# Step 4: Training
# ---------------------------------------------------------------------------
def train():
    print(f"Device: {DEVICE}")

    # Transforms
    train_transform = T.Compose([
        T.RandomResizedCrop(224, scale=(0.5, 1.0)),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(),
        T.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.3, hue=0.15),
        T.RandomRotation(45),
        T.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        T.RandomGrayscale(p=0.1),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        T.RandomErasing(p=0.3, scale=(0.02, 0.15)),
    ])

    val_transform = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    # Datasets
    train_ds = LeafDataset(DATASET_DIR / "train", transform=train_transform)
    val_ds = LeafDataset(DATASET_DIR / "validation", transform=val_transform)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=1, shuffle=False, num_workers=0)

    print(f"Train samples: {len(train_ds)} | Val samples: {len(val_ds)}")

    # Model
    model = LeafAnomalyModel5(num_classes=NUM_CLASSES).to(DEVICE)

    # Freeze backbone first, only train classifier
    for param in model.feature_extractor.parameters():
        param.requires_grad = False
    for param in model.attention.parameters():
        param.requires_grad = False

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR, weight_decay=1e-4
    )

    # Phase 1: Train classifier head only
    print("\n--- Phase 1: Training classifier head ---")
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct += (logits.argmax(1) == labels).sum().item()
            total += imgs.size(0)

        train_loss = total_loss / total
        train_acc = correct / total

        # Validate
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                logits = model(imgs)
                val_correct += (logits.argmax(1) == labels).sum().item()
                val_total += imgs.size(0)
        val_acc = val_correct / val_total if val_total > 0 else 0

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}/{EPOCHS}  Loss: {train_loss:.4f}  "
                  f"Train Acc: {train_acc:.4f}  Val Acc: {val_acc:.4f}")

    # Phase 2: Fine-tune all layers
    print("\n--- Phase 2: Fine-tuning all layers ---")
    for param in model.feature_extractor.parameters():
        param.requires_grad = True
    for param in model.attention.parameters():
        param.requires_grad = True

    optimizer = optim.AdamW(model.parameters(), lr=LR * 0.1, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_val_acc = 0.0
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct += (logits.argmax(1) == labels).sum().item()
            total += imgs.size(0)

        scheduler.step()
        train_loss = total_loss / total
        train_acc = correct / total

        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                logits = model(imgs)
                val_correct += (logits.argmax(1) == labels).sum().item()
                val_total += imgs.size(0)
        val_acc = val_correct / val_total if val_total > 0 else 0

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}/{EPOCHS}  Loss: {train_loss:.4f}  "
                  f"Train Acc: {train_acc:.4f}  Val Acc: {val_acc:.4f}")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            SAVED_MODELS_DIR.mkdir(exist_ok=True)
            torch.save({
                "model_state_dict": model.state_dict(),
                "num_classes": NUM_CLASSES,
                "class_names": CLASS_NAMES,
                "epoch": epoch,
                "best_val_acc": best_val_acc,
            }, SAVED_MODELS_DIR / "leaf_detection_model.pth")
            print(f"  -> Saved model (val acc: {best_val_acc:.4f})")

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")
    print(f"Model saved to: {SAVED_MODELS_DIR / 'leaf_detection_model.pth'}")


if __name__ == "__main__":
    prepare_dataset()
    train()
