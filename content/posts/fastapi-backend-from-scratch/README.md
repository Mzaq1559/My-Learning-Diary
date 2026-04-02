---
title: Building a Production-Ready FastAPI Backend from Scratch
slug: fastapi-backend-from-scratch
date: 2024-03-15
tags: [fastapi, python, backend, docker]
category: tech
series: backend-and-apis
seriesOrder: 4
---

FastAPI has become my go-to framework for building high-performance Python backends. After working on several production projects, I've developed a solid blueprint for scaffolding new FastAPI applications that scale well and remain maintainable. In this post, I'll walk you through my approach.

## Project Structure & Setup

Start by creating a clean directory structure that separates concerns. I organize my projects with separate folders for models, schemas, routes, services, and core configuration. This makes it easy to locate code and prevents the codebase from becoming a monolith.

```
app/
  ├── main.py
  ├── core/
  │   ├── config.py
  │   └── dependencies.py
  ├── models/
  │   └── user.py
  ├── schemas/
  │   └── user.py
  ├── routes/
  │   └── users.py
  └── services/
      └── user_service.py

# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sqlalchemy==2.0.23
```

## Pydantic Models for Validation

Pydantic is where FastAPI truly shines. Define your request and response schemas with type hints, and FastAPI handles all validation automatically. I create separate schemas for input, output, and database models to maintain clear boundaries.

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool

    class Config:
        from_attributes = True
```

## Async Routes & Dependency Injection

FastAPI's async support is fantastic for I/O-bound operations. Use async/await for database calls, external API requests, and file operations. Dependency injection keeps your code clean and testable—I use it for database sessions, authentication, and configuration.

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    user = await service.create_user(user_data)
    if not user:
        raise HTTPException(status_code=400, detail="User already exists")
    return user
```

## Docker Deployment

I always containerize my FastAPI apps for consistent deployment. Here's a production-ready Dockerfile with a non-root user, optimized layer caching, and uvicorn configured for performance. Pair it with docker-compose for local development with PostgreSQL and Redis.

```
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app ./app

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

This blueprint has served me well across multiple projects. FastAPI's speed, automatic docs, and type safety make it perfect for modern Python backends. Start with this structure, and you'll have a solid foundation for building scalable APIs.
