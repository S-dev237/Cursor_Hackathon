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

How to use deploy.sh
List available commits/tags first:

./deploy.sh --list
Deploy the latest commit on main (no arguments):

./deploy.sh
Deploy a specific commit, tag, or branch:

./deploy.sh --ref 2728a90c01       # specific commit SHA (short or full)
./deploy.sh --ref v1.2.0           # a tag (once you create tags)
./deploy.sh --ref my-branch        # any branch name
What the script does
Fetches the chosen commit's tarball directly from the GitHub API (using the fine-grained token).
Strips the outer Cursor_Hackathon/ wrapper and repacks only the backend/ folder.
Uploads the clean tarball to the VPS via SCP.
Stops the PM2 app, swaps in the new files (replaces src/, alembic/, tests/, etc.), and restarts.
Verifies the health endpoint responds 200. If not, it prints where to look at PM2 logs.
