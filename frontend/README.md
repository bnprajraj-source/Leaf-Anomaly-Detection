# Leaf Anomaly Detection — Frontend

React + Vite + Tailwind CSS interface for the leaf disease detection system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:3000**

## Build for Production

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

## Pages

| Route        | Description                      |
|-------------|----------------------------------|
| `/`          | Home — overview & features       |
| `/detection` | Detection — upload & analyze     |
| `/about`     | About — pipeline & architecture  |
