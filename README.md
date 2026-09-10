# BI Command Center

Analytics dashboard for the Olist e-commerce dataset. The application consists of a Vite/React frontend, a FastAPI backend, PostgreSQL analytics tables, and Redis response caching.

## Local development

1. Start Redis with `docker compose up -d redis`.
2. Create `backend/.env` with the PostgreSQL connection variables and `JWT_SECRET_KEY`.
3. Start the API with `cd backend && python -m uvicorn main:app --reload --port 8000`.
4. Start the frontend with `cd frontend && npm ci && npm run dev`.

The frontend uses `VITE_API_URL` when set and otherwise calls `/api`. The local Vite app therefore needs `VITE_API_URL=http://localhost:8000/api`.

## Render deployment

The repository includes `render.yaml`, which defines:

- `bi-command-center-api` as a native Render Python Web Service.
- `bi-command-center-frontend` as a native Render Static Site.

Create a Render Blueprint from the GitHub repository and select the `main` branch. Both services have `autoDeploy: true`, so pushes to `main` trigger Render deployments automatically. Docker and GitHub Container Registry are not required.

### Backend environment variables

Set these values in the Render Web Service environment:

```text
DATABASE_HOST       PostgreSQL hostname
DATABASE_PORT       PostgreSQL port, usually 5432
DATABASE_NAME       PostgreSQL database name
DATABASE_USER       PostgreSQL username
DATABASE_PASSWORD   PostgreSQL password
JWT_SECRET_KEY      Long random secret used to sign access tokens
REDIS_URL           Redis connection URL
CORS_ORIGINS        Deployed frontend URL, for example https://bi-command-center-frontend.onrender.com
```

Do not commit these values to the repository. Enter them in Render’s environment settings or use a Render environment group.

### Frontend environment variables

Set this value in the Render Static Site environment:

```text
VITE_API_URL        Deployed API URL with the /api path, for example https://bi-command-center-api.onrender.com/api
```

`VITE_API_URL` is injected at build time. After changing it in Render, trigger a new deployment so the frontend bundle contains the updated API URL.

The backend health endpoint is `/health`. The frontend build command is `npm ci && npm run build`, and the published directory is `frontend/dist` relative to the repository root.
