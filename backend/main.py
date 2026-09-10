from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection
from routes import kpis, revenue, orders, customers, products, sellers, delivery, reviews, payments, health_score, growth, supply_demand, statistics, auth, notifications, alerts, chat
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis

@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6380")
    redis = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    try:
        yield
    finally:
        await redis.close()

app = FastAPI(title="BI Command Center API", lifespan=lifespan)

# Setup CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpis.router)
app.include_router(revenue.router)
app.include_router(orders.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(sellers.router)
app.include_router(delivery.router)
app.include_router(reviews.router)
app.include_router(payments.router)
app.include_router(health_score.router)
app.include_router(growth.router)
app.include_router(supply_demand.router)
app.include_router(statistics.router)
app.include_router(auth.router)
app.include_router(notifications.router)
app.include_router(alerts.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"Message": "BI Command Center API is running"}

@app.get("/health")
def health_check():
    conn = get_connection()
    conn.close()

    return {
        "status": "healthy",
        "database": "connected"
    }