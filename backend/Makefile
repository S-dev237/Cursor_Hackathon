VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn
ALEMBIC := $(VENV)/bin/alembic
PYTEST := $(VENV)/bin/pytest

.PHONY: venv install dev migrate revision test docker-up docker-down clean

# Crée le venv (obligatoire sur Debian/Ubuntu — PEP 668)
venv:
	@test -d $(VENV) || python3 -m venv $(VENV)
	@echo "✓ venv prêt : $(VENV)"

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✓ Dépendances installées dans $(VENV)"

dev: venv
	@test -f $(UVICORN) || (echo "Lancez d'abord : make install" && exit 1)
	$(UVICORN) src.main:app --reload --host 0.0.0.0 --port 8000

migrate: venv
	$(ALEMBIC) upgrade head

revision: venv
	$(ALEMBIC) revision --autogenerate -m "$(msg)"

test: venv
	$(PYTEST) tests/ -v --asyncio-mode=auto

docker-up:
	docker compose -f ../docker-compose.yml up -d

docker-down:
	docker compose -f ../docker-compose.yml down

clean:
	rm -rf $(VENV) __pycache__ .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
