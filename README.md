# 🌿 Leaf Anomaly Detection System

An AI-powered full-stack application for detecting plant leaf diseases using deep learning with **Attention Mechanism** and **Meta-Learning**.

## Tech Stack

| Layer     | Technologies                                           |
|-----------|--------------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Axios, React Router      |
| Backend   | Python, FastAPI, Uvicorn                               |
| AI / ML   | PyTorch, ResNet-50, CBAM Attention, MAML Meta-Learning |
| DevOps    | Docker, Docker Compose                                 |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) NVIDIA GPU with CUDA for faster inference

---

### 1. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend: **http://localhost:3000**

---

### 3. (Optional) Docker Compose

```bash
# Build and run both services
docker-compose up --build

# Stop
docker-compose down
```

---

## Project Structure

```
Leaf-Anomaly-Detection/
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, UploadImage, ResultCard, Loader
│   │   ├── pages/          # Home, Detection, About
│   │   └── services/       # Axios API client
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── config.py       # Constants & paths
│   │   ├── routes/         # /predict, /health
│   │   ├── models/         # LeafAnomalyModel, CBAM, MAML
│   │   └── utils/          # Image processing & preprocessing
│   ├── dataset/            # train / test / validation
│   ├── saved_models/       # leaf_detection_model.pth
│   └── requirements.txt
│
├── notebooks/
│   └── model_training.ipynb
│
├── docs/
│   └── project_documentation.md
│
└── docker-compose.yml
```

## API Usage

```bash
# Predict from a leaf image
curl -X POST http://localhost:8000/predict \
     -F "file=@/path/to/leaf.jpg"

# Health check
curl http://localhost:8000/health
```

**Sample Response:**

```json
{
  "prediction":          "Diseased",
  "confidence":          94.3,
  "anomaly_type":        "Leaf Spot",
  "processing_time_ms":  143.7,
  "attention_map_available": true
}
```

## Training the Model

1. Populate `backend/dataset/train/`, `test/`, `validation/` with labeled leaf images
2. Open `notebooks/model_training.ipynb`
3. Run all cells — the best checkpoint is saved to `backend/saved_models/leaf_detection_model.pth`

## License

MIT
