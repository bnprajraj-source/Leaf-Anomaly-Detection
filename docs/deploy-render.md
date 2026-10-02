# Deploy on Render

This guide deploys the full app with one Render Blueprint:

| Service | Type | URL |
|---------|------|-----|
| `leaf-anomaly-backend` | Python web service | `https://leaf-anomaly-backend-*.onrender.com` |
| `leaf-anomaly-frontend` | Static site (React) | `https://leaf-anomaly-frontend-*.onrender.com` |
| MongoDB Atlas M0 | External database | You provide `MONGODB_URL` |

The UI talks only to the Python backend. The Node `db-service` is not deployed.

---

## Prerequisites

1. GitHub repo with this project (default branch `main`)
2. Free [Render](https://dashboard.render.com) account
3. Free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
4. Trained model at `backend/saved_models/leaf_detection_model.pth` (~92MB) — **must be committed** (already allowed in `.gitignore`)

---

## Step 1 — Confirm the model is in Git

```bash
cd Leaf-Anomaly-Detection
git check-ignore -v backend/saved_models/leaf_detection_model.pth
# Should print nothing (file is NOT ignored)

git status backend/saved_models/leaf_detection_model.pth
```

If untracked, add and commit it:

```bash
git add backend/saved_models/leaf_detection_model.pth render.yaml \
  backend/requirements-render.txt backend/app/models/leaf_model.py .gitignore
git commit -m "Prepare Render deployment"
git push origin main
```

---

## Step 2 — Create MongoDB Atlas (free M0)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Build a Database** → **Shared (M0)** → region close to **Oregon** (e.g. N. Virginia / Oregon)
3. **Database Access** → Add user (username + password — save them)
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)  
   (Fine for free tier / demo. Tighten later if you have static egress IPs.)
5. **Connect** → **Drivers** → copy the connection string, e.g.

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<user>` and `<password>`. Keep the string — you paste it in Render next.

---

## Step 3 — Deploy the Blueprint on Render

1. Open [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Blueprint**
3. Connect GitHub → select `bnprajraj-source/Leaf-Anomaly-Detection`
4. Render reads `render.yaml` at the repo root
5. When prompted for env vars:
   - **`MONGODB_URL`** → paste your Atlas connection string
   - **`SECRET_KEY`** → leave empty (Render generates one)
   - **`VITE_API_URL` / `FRONTEND_URL`** → leave empty (auto-wired from service URLs)
6. Click **Apply**

First deploy takes several minutes (CPU torch install + npm build).

---

## Step 4 — Verify

| Check | Expected |
|-------|----------|
| Backend health | `GET https://leaf-anomaly-backend-*.onrender.com/health` → `"status": "healthy"`, `"model_ready": true`, `"db_connected": true` |
| API docs | `https://leaf-anomaly-backend-*.onrender.com/docs` |
| Frontend | `https://leaf-anomaly-frontend-*.onrender.com` loads; signup/login works |

If `db_connected` is false: recheck `MONGODB_URL`, Atlas user/password, and Network Access (`0.0.0.0/0`).

---

## Environment variables (what goes where)

| Variable | Where | Value |
|----------|--------|--------|
| `MONGODB_URL` | Backend (manual) | Atlas SRV string |
| `MONGODB_DB_NAME` | Backend (Blueprint) | `leaf_anomaly_detection` |
| `SECRET_KEY` | Backend (auto) | Render-generated |
| `FRONTEND_URL` | Backend (auto) | Frontend `RENDER_EXTERNAL_URL` |
| `VITE_API_URL` | Frontend (auto) | Backend `RENDER_EXTERNAL_URL` |

Auto-wired values update on Blueprint sync when service URLs change.

---

## Free-tier notes

- Backend **sleeps after ~15 min** idle → first request ~30–60s (cold start)
- **512 MB RAM / 0.1 CPU** — CPU-only PyTorch; inference is slower than local GPU
- No persistent disk — all app data lives in Atlas
- ImageNet backbone download is skipped when the fine-tuned `.pth` is present

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on `pip install torch` | Confirm `buildCommand` uses `--index-url .../cpu`; free disk should be enough with CPU wheels |
| `"model_ready": false` | Ensure `.pth` was committed and path is `backend/saved_models/leaf_detection_model.pth` |
| CORS errors in browser | Confirm frontend deployed; Blueprint re-sync so `FRONTEND_URL` updates |
| Login 503 | Backend can’t reach Atlas — fix `MONGODB_URL` / IP allow list |
| Frontend 404 on refresh | SPA rewrite `/* → /index.html` must be present in `render.yaml` |

---

## Updating later

```bash
git add -A
git commit -m "Update app"
git push origin main
```

Render auto-deploys both services on push to `main`.

If you only change `render.yaml`, use **Blueprint → Sync** in the dashboard (not just redeploy).
