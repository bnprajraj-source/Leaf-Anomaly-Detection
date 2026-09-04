# Leaf Anomaly Detection — Backend

FastAPI backend powering the leaf disease detection pipeline.

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API runs at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

## Endpoints

| Method | Path       | Description                        |
|--------|------------|------------------------------------|
| GET    | `/`        | API info                           |
| GET    | `/health`  | Health check + model readiness     |
| POST   | `/predict` | Upload leaf image → get prediction |

### POST /predict

```bash
curl -X POST http://localhost:8000/predict \
     -F "file=@/path/to/leaf.jpg"
```

**Response:**
```json
{
  "prediction":          "Diseased",
  "confidence":          94.3,
  "anomaly_type":        "Leaf Spot",
  "all_scores":          { "Healthy": 2.1, "Leaf Spot": 94.3, ... },
  "processing_time_ms":  145.2,
  "image_meta":          { "width": 512, "height": 512, "mode": "RGB" },
  "attention_map_available": true
}
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Config & constants
│   ├── routes/
│   │   └── prediction.py    # /predict & /health endpoints
│   ├── models/
│   │   ├── leaf_model.py    # Main model + load/predict
│   │   ├── attention_model.py # CBAM attention module
│   │   └── meta_learning.py # MAML meta-learning wrapper
│   └── utils/
│       ├── image_processing.py  # PIL image helpers
│       └── preprocessing.py     # Tensor preprocessing pipeline
├── dataset/
│   ├── train/
│   ├── test/
│   └── validation/
├── saved_models/
│   └── leaf_detection_model.pth
└── requirements.txt
```

## Training

Open and run `notebooks/model_training.ipynb` to train the model.  
The trained weights are saved to `saved_models/leaf_detection_model.pth`.
