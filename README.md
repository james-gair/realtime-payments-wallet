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

_(All required environment variables are listed in our Final Report – Installation Manual.)_

- .env
- backend/serviceAccountKey.json
- backend/.env
- frontend/.env

### 🔄 Run it in docker (from the repository root)

Start the frontend, backend, mock API and database.

```bash
docker-compose up --build
```

### 🐳 Docker commands & Testing (from the repository root)

#### Run tests

We use Jest for frontend and backend tests. Test files live in:

- backend/src/\_\_tests\_\_

- frontend/src/\_\_tests\_\_

- mock-id-check-api/src/\_\_tests\_\_ (mock ID-check service)

- SQL function tests are in backend/src/database/test.sql, run with backend/src/database/test_seeds.sql and run via psql.

Run these commands to execute the tests:

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

#### other commands

- Reset database (clears all data and re-applies schema/seed) and rebuild:

```bash
docker-compose down -v
docker-compose up --build
```

### 🔗 Access the webpages on your machine

- **Frontend** 💻 http://localhost:5173
- **Backend** 🛠️ http://localhost:4000
- **Backend API docs** http://localhost:4000/api-docs
- **Mock ID Check API docs** http://localhost:4001/api-docs
  📍 To 'Try it out' Mock ID Check API docs: use `mock-kyc-secret-token` in the Swagger **Authorize** dialog. (only sample data will pass the check. You can find the sample data in: /mock-idcheck-api/src/sampleData.ts)

_Note: Don't forget to copy the .env file to local machine_

### 🧪 KYC & Test Accounts for Marking

In our prototype, money-movement features (bill payments, transfers, etc.) are only available to **KYC-verified** users **with funds** in their wallet.

- In a real-world scenario:

  - A new user must complete KYC by providing valid ID documents.

  - They must then transfer money from their bank account to our wallet — a process that requires interacting with an actual bank.

- In our prototype:
  To make marking simple and avoid real banking steps, we provide:

  - A pre-funded demo account so you can try all money features without needing a real top-up.

  - Mock KYC records so you can pass verification instantly.

  - A pre-verified account in case KYC testing is skipped or fails.

##### 1. Pre-funded account (funds already loaded, but KYC still required)

- Email: test@gmail.com
- Password: testtest
- Already has funds — you can test all features immediately.

##### 2. Pass KYC with mock data

Create or log in with any account, and when redirected to the KYC page, enter one of these records exactly, upload any .png or .jpeg image for the ID front, and take a webcam photo as instructed.

```bash

  idType: "driver_license",
  fullName: "Emily Chen",
  dateOfBirth: "1994-06-15",
  idNumber: "NSW1234567",
  placeOfIssue: "NSW",
  idExpDate: "2026-10-01",

#OR

  idType: "passport",
  fullName: "David Tran",
  dateOfBirth: "1990-12-03",
  idNumber: "P987654321",
  placeOfIssue: "Australia",
  idExpDate: "2029-03-15",

```

##### 3. Pre-verified account (if KYC fails, which should not happen if the entered info is the same as the mock data shown above)

- Email: testj@gmail.com
- Password: testj@gmail.com
- Already KYC-verified.
