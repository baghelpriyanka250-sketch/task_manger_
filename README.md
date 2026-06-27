# Aether Tasks - Premium FastAPI Task Manager

Aether Tasks is a task management application featuring a modern glassmorphic web design, dynamic interactions, and an asynchronous API. Built using FastAPI, SQLAlchemy, and SQLite (easily switchable to MySQL/SQL Server).

---

## Features

- **Rich, Dynamic UX**: High-fidelity glassmorphic card design with dark mode background gradients.
- **Kanban Board**: Drag & drop tasks between status columns (To Do, In Progress, Completed) with immediate server updates.
- **List View Toggle**: Easily shift between Kanban board and a compact grid table.
- **Filter and Search**: Instantly query tasks by title or description, and filter by status or priority.
- **RESTful API**: Fast and light FastAPI endpoints for complete task life-cycle actions (CRUD).
- **Interactive API Docs**: Built-in Swagger API playground.

---

## Folder Layout

```
crud-fastapi/
│
├── app/
│   ├── main.py          # App initialization & routing setup
│   ├── database.py      # SQLAlchemy connection details & Dependency injection
│   ├── models.py        # Database models (SQLAlchemy)
│   ├── schemas.py       # Pydantic validation & response serialization
│   ├── crud.py          # CRUD query helpers
│   ├── routers.py       # Task API endpoints (/api/tasks/)
│   └── templates/
│       └── index.html   # Jinja2 layout template
│
├── static/
│   ├── style.css        # Glassmorphic layout styling, colors, and keyframe animations
│   └── script.js        # Drag-and-drop mechanics, async fetches, filter rendering
│
├── requirements.txt     # Python packages list
└── README.md            # Setup instructions
```

---

## Getting Started

### 1. Install Dependencies
Ensure you have Python 3.8+ installed. Navigate to the project root (`crud-fastapi/`) and run:
```bash
pip install -r requirements.txt
```

### 2. Launch Development Server
Start the Uvicorn ASGI server:
```bash
python -m uvicorn app.main:app --reload
```
Alternatively:
```bash
uvicorn app.main:app --reload
```

### 3. Open Application
Open your browser and navigate to:
- **Application Front-end**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Switching Database to MySQL
To use MySQL, edit `app/database.py` or export a `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="mysql+pymysql://user:password@localhost/db_name"
```
*(Make sure to install `pymysql` or your database driver of choice via `pip install pymysql`)*.
