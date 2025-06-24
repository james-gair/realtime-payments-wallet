# Backend Setup – COMP3900

This is the backend API service built with **Express.js** and **TypeScript**.

## 🚀 Getting Started

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

## 📁 Folder Structure

```plaintext
comp3900_backend/
├── dist/
├── node_modules/
├── src/
│   ├── __mocks__/
│   ├── dtos/
│   ├── handlers/
│   ├── routes/
│   ├── types/
│   ├── integration-tests/
│   └── (entry files like createApp.ts, index.ts)
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Reference

- Initial setup based on Anson's [YouTube tutorial](https://www.youtube.com/watch?v=Be7X6QJusJA&t=2138s), with custom modifications.
- Logic and structure will be adapted and extended in the actual project phase.
