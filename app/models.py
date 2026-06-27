import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo", index=True)      # 'todo', 'in_progress', 'completed'
    priority = Column(String(50), default="medium", index=True)  # 'low', 'medium', 'high'
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
