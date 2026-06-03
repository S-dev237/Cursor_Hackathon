# Gestion de documents académiques

## Backend (FastAPI)

Sur Debian/Ubuntu, n’utilisez pas `pip` en global (PEP 668). Utilisez le venv du Makefile :

```bash
cd backend
cp .env.example .env          # puis éditer .env (OPENAI_API_KEY, etc.)
make install                  # crée .venv + installe les dépendances
make docker-up              # Postgres + MinIO + Prolog (optionnel)
make dev                    # http://localhost:8000/docs
```

- API : http://localhost:8000/docs  
- Admin DB : http://localhost:8000/admin (login par défaut dans `.env` : `ADMIN_USERNAME` / `ADMIN_PASSWORD`)

### Commandes utiles

| Commande | Description |
|----------|-------------|
| `make venv` | Crée uniquement `backend/.venv` |
| `make install` | venv + `pip install -r requirements.txt` |
| `make dev` | Lance uvicorn avec rechargement |
| `make test` | Tests unitaires |
| `make clean` | Supprime `.venv` et caches |

### Sans Makefile

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
