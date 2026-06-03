PYTHON = python
UVICORN = uvicorn

.PHONY: dev install migrate revision test docker-up docker-down

install:
	pip install -r requirements.txt

dev:
	$(UVICORN) src.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "$(msg)"

test:
	pytest tests/ -v --asyncio-mode=auto

docker-up:
	docker compose -f ../docker-compose.yml up -d

docker-down:
	docker compose -f ../docker-compose.yml down
