cd backend
cp .env.example .env   # Renseigner OPENAI_API_KEY
make docker-up         # Lance Postgres + MinIO + Prolog
make install
make dev               # http://localhost:8000/docs