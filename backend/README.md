# Backend Setup – COMP3900

This is the backend API service built with **Express.js** and **TypeScript**.

## 🚀 Getting Started

### 🔄 Current setup (as of 25 June 2025)

_You no longer need to install dependencies manually. Everything runs in Docker._

1. Start the backend and database (and also frontend when done):

```bash
docker-compose up --build
```

2. Run backend tests inside Docker:

```bash
docker exec -it backend_app npm test
```

3. Run a custom SQL query (using the query.sql inside the database folder):

```bash
docker exec -i postgres_db psql -U admin -d mydb < ./backend/src/database/query.sql
```

4. Reset database (clears all data and re-applies schema/seed):

```bash
docker-compose down -v

```

_Note: Don't forget to copy the .env file to local machine (from confluence)_

## 📁 Folder Structure

```plaintext
comp3900_backend/
├── dist/
├── node_modules/
├── src/
│   ├── __mocks__/
│   ├── __tests__/
│   ├── database/
│   ├── dtos/
│   ├── handlers/
│   ├── routes/
│   ├── types/
│   ├── integration-tests/
│   └── (entry files like createApp.ts, index.ts)
├── Dockerfile
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Reference

- Initial setup based on Anson's [YouTube tutorial](https://www.youtube.com/watch?v=Be7X6QJusJA&t=2138s), with custom modifications.
- Logic and structure will be adapted and extended in the actual project phase.

---

## 🧪 Legacy / local-only setup (not using Docker)

_For running the backend directly on your machine:_

1. install dependencies:

```bash
npm i
```

2. **Run the backend in development**

```bash
npm run dev
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

- All tests:
  ```bash
  npm test
  ```
- Integration tests only (supertest):
  ```bash
  npm run test:integration
  ```
