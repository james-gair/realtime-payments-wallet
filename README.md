# COMP3900: Computer Science Project

P29: Design And Prototype Of A Fintech App With Payto Integration Via Apis For Real-Time Bank Payments In Australia

## 🚀 Getting Started

📌 Run all Docker commands from the repository root (the top-level folder that contains docker-compose.yml).

### 🐑 Clone the repo

For example:

```bash
git clone git@github.com:unsw-cse-comp99-3900/capstone-project-25t2-3900-w09a-cherry.git
```

or choose your preferred clone method (HTTPS, SSH, or GitHub CLI).

### 🗂️ Create the following files

- .env
- backend/serviceAccountKey.json
- backend/.env
- frontend/.env
- .env
- backend/serviceAccountKey.json
- backend/.env
- frontend/.env

### 🔄 Run it in docker (from the repository root)

Start the frontend, backend, mock API and database.

```bash
docker-compose up --build
```

### 🔗 Access the webpages on your machine

- **Frontend** 💻 http://localhost:5173
- **Backend** 🛠️ http://localhost:4000
- **Backend API docs** http://localhost:4000/api-docs
- **Mock ID Check API docs** http://localhost:4001/api-docs
  📍 To 'Try it out' Mock ID Check API docs: use `mock-kyc-secret-token` in the Swagger **Authorize** dialog. (only sample data will pass the check. You can find the sample data in: /mock-idcheck-api/src/sampleData.ts)

### 🐳 Docker commands (from the repository root)

- Run backend tests inside Docker:

```bash
docker exec -it backend_app npm test
```

- Run frontend tests inside Docker:

```bash
docker exec -it frontend_app npm test
```

- Run mock ID check API tests inside Docker:

```bash
docker exec -it mock_idcheck_api npm test
```

- Run sql function tests inside Docker:

```bash
# copy the sql test file and seed file to docker
docker cp backend/src/database/test_seeds.sql postgres_db:/tmp/test_seeds.sql
docker cp backend/src/database/test.sql        postgres_db:/tmp/test.sql
# run the sql tests in docker
docker exec -i postgres_db psql -U admin -d mydb -v ON_ERROR_STOP=1 -f /tmp/test.sql
```

- Reset database (clears all data and re-applies schema/seed) and rebuild:

```bash
docker-compose down -v
docker-compose up --build
```

_Note: Don't forget to copy the .env file to local machine_
