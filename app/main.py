from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.database import engine, Base
from app.routers import router as task_router
import os

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Premium Task Manager",
    description="A FastAPI task manager application with SQL Server, SQLite, or MySQL and glassmorphism styling.",
    version="1.0.0"
)

# Mount static files directory
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Setup templates directory correctly
templates = Jinja2Templates(directory="app/templates")

# Register API Router
app.include_router(task_router)

# Serve the HTML frontend
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")
