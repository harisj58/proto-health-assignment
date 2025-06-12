from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from utils.database import init_database

load_dotenv()

origins = [
    "http://localhost:3000",
]

init_database()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.websocket_routes import websocket_router

app.include_router(websocket_router)
