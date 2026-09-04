# Deployment Guide

This document explains a recommended GitHub-based deployment workflow for the Leaf Anomaly Detection project.

Summary:
- CI builds container images for `backend`, `db-service`, and `frontend` and publishes them to GitHub Container Registry (GHCR).
- A deploy workflow SSHes into your server and runs `docker-compose` to pull and restart the containers.

Prerequisites:
- A GitHub repository for this project.
- A server with Docker and Docker Compose installed and reachable via SSH.
- Configure GitHub Secrets for the repository:
  - `GITHUB_TOKEN` (automatically provided by Actions)
  - `SSH_HOST` — host/IP of your server
  - `SSH_USER` — SSH username
  - `SSH_PRIVATE_KEY` — private key for SSH (no passphrase or stored in Secrets)
  - `SSH_PORT` — (optional) SSH port (default 22)
  - `DEPLOY_DIR` — path on server where `docker-compose.yml` lives

Steps:
1. Commit and push to `main`. The `ci-build-push` workflow will build and publish container images to GHCR.
2. After images are published, the `deploy-ssh` workflow will SSH into your server and run `docker-compose pull && docker-compose up -d` in `DEPLOY_DIR`.

Notes:
- Do not commit private keys or `.env` files with secrets. Use the provided `.env.example` files and set secrets in the server or GitHub Secrets.
- The model weights (`backend/saved_models/leaf_detection_model.pth`) are intentionally ignored by Git. Provide them at deploy time by mounting `./backend/saved_models` on the host or arranging the image build to include them (beware of large image sizes).

Alternatives & Extras:

- Docker Hub: if you prefer Docker Hub over GHCR, use the `ci-dockerhub.yml` workflow. Configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in GitHub Secrets. The workflow will push images to `DOCKERHUB_USERNAME/leaf-<service>:latest`.

- GitHub Pages (Frontend-only): the `frontend-pages.yml` workflow builds the Vite frontend and publishes `frontend/dist` to the `gh-pages` branch for static hosting. This is useful if you only need to host the UI and have the backend hosted elsewhere.

- Model artifacts: for production deployments, consider storing model weights in cloud object storage (S3, GCS) and fetching them on container startup, or build a separate artifacts image and mount it read-only.

