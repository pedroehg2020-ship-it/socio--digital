import logging
import os
from pathlib import Path

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import client
from routes import (
    auth_routes,
    company_routes,
    upload_routes,
    transaction_routes,
    dashboard_routes,
    chat_routes,
    radar_routes,
    customer_routes,
    inventory_routes,
    command_routes,
    memory_routes,
    sales_routes,
)
from scheduler import start_scheduler

app = FastAPI(title="Sócio Digital API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Sócio Digital API"}


api_router.include_router(auth_routes.router)
api_router.include_router(company_routes.router)
api_router.include_router(upload_routes.router)
api_router.include_router(transaction_routes.router)
api_router.include_router(dashboard_routes.router)
api_router.include_router(chat_routes.router)
api_router.include_router(radar_routes.router)
api_router.include_router(customer_routes.router)
api_router.include_router(inventory_routes.router)
api_router.include_router(command_routes.router)
api_router.include_router(memory_routes.router)
api_router.include_router(sales_routes.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
