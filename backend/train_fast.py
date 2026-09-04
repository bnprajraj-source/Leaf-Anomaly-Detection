"""
Fast training script - minimal epochs, small batches, quick augmentation.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as T
import torchvision.models as tv_models
from PIL import Image

from app.config import SAVED_MODELS_DIR, IMAGENET_MEAN, IMAGENET_STD
from app.models.attention_model import CBAM

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
NUM_CLASSES = 5
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


class LeafDataset(Dataset):
    def __init__(self, root, transform=None):
        self.transform = transform
        self.samples = []
        self.class_to_idx = {c: i for i, c in enumerate(CLASS_NAMES)}
        root = Path(root)
        for cls in CLASS_NAMES:
            cls_dir = root / cls
            if cls_dir.exists():
                for f in cls_dir.glob("*.jpg"):
                    self.samples.append((str(f), self.class_to_idx[cls]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


class LeafModel(nn.Module):
    def __init__(self):
        super().__init__()
        backbone = tv_models.resnet50(weights=tv_models.ResNet50_Weights.DEFAULT)
        self.features = nn.Sequential(*list(backbone.children())[:-2])
        self.attention = CBAM(2048, reduction_ratio=16, spatial_kernel=7)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(0.5)
        self.fc = nn.Linear(2048, NUM_CLASSES)

    def forward(self, x):
        x = self.features(x)
        x = self.attention(x)
        x = self.pool(x)
        x = self.drop(x.flatten(1))
        return self.fc(x)


def main():
    print(f"Device: {DEVICE}")

    import shutil
    for split in ["train", "validation", "test"]:
        for cls in CLASS_NAMES:
            (DATASET_DIR / split / cls).mkdir(parents=True, exist_ok=True)

    for cls_name, img_file in IMAGE_MAP.items():
        src = ASSETS_DIR / img_file
        if not src.exists():
            print(f"Missing: {src}")
            continue
        for i in range(15):
            dst = DATASET_DIR / "train" / cls_name / f"{i:03d}.jpg"
            shutil.copy2(src, dst)
        shutil.copy2(src, DATASET_DIR / "validation" / cls_name / "val.jpg")
        shutil.copy2(src, DATASET_DIR / "test" / cls_name / "test.jpg")

    train_transform = T.Compose([
        T.RandomResizedCrop(224, scale=(0.6, 1.0)),
        T.RandomHorizontalFlip(),
        T.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        T.RandomRotation(30),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    val_transform = T.Compose([
        T.Resize(256), T.CenterCrop(224), T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    train_ds = LeafDataset(DATASET_DIR / "train", transform=train_transform)
    val_ds = LeafDataset(DATASET_DIR / "validation", transform=val_transform)
    train_loader = DataLoader(train_ds, batch_size=4, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=1, shuffle=False, num_workers=0)

    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    model = LeafModel().to(DEVICE)

    for p in model.features.parameters():
        p.requires_grad = False
    for p in model.attention.parameters():
        p.requires_grad = False

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=1e-3, weight_decay=1e-4
    )

    print("\n--- Phase 1: Classifier head (20 epochs) ---")
    for epoch in range(1, 21):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct += (out.argmax(1) == labels).sum().item()
            total += imgs.size(0)

        model.eval()
        vc, vt = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                out = model(imgs)
                vc += (out.argmax(1) == labels).sum().item()
                vt += 1

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}  Loss: {total_loss/total:.4f}  "
                  f"Train: {correct/total:.4f}  Val: {vc/vt:.4f}")

    print("\n--- Phase 2: Fine-tune all (20 epochs) ---")
    for p in model.features.parameters():
        p.requires_grad = True
    for p in model.attention.parameters():
        p.requires_grad = True

    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    best_acc = 0.0

    for epoch in range(1, 21):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item() * imgs.size(0)
            correct += (out.argmax(1) == labels).sum().item()
            total += imgs.size(0)

        model.eval()
        vc, vt = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
                out = model(imgs)
                vc += (out.argmax(1) == labels).sum().item()
                vt += 1

        val_acc = vc / vt if vt > 0 else 0
        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}  Loss: {total_loss/total:.4f}  "
                  f"Train: {correct/total:.4f}  Val: {val_acc:.4f}")

        if val_acc >= best_acc:
            best_acc = val_acc
            SAVED_MODELS_DIR.mkdir(exist_ok=True)
            torch.save({
                "model_state_dict": model.state_dict(),
                "num_classes": NUM_CLASSES,
                "class_names": CLASS_NAMES,
            }, SAVED_MODELS_DIR / "leaf_detection_model.pth")
            print(f"  -> Saved (val: {best_acc:.4f})")

    print(f"\nDone. Best val: {best_acc:.4f}")


if __name__ == "__main__":
    main()
