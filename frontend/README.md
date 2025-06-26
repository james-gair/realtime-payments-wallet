# Frontend Setup – COMP3900

This is the frontend application built with **React**, **TypeScript**, and **Vite**.

## 🚀 Getting Started

### 🔄 Current setup (as of 26 June 2025)

1. Start the frontend, backend, and database:

```bash
docker-compose up --build
```

2. Access the frontend application:

```
http://localhost:5173
```

3. Run frontend tests inside Docker:

```bash
docker exec -it frontend_app npm test
```

4. Run linting inside Docker:

```bash
docker exec -it frontend_app npm run lint
```

_Note: Don't forget to copy the .env file to local machine (from confluence)_

## 📁 Folder Structure

```plaintext
comp3900_frontend/
├── dist/              # Build output (generated)
├── node_modules/      # Dependencies (generated)
├── public/            # Static assets
├── src/
│   ├── assets/        # Application assets
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # CSS/SCSS files
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Application entry point
├── Dockerfile
├── .dockerignore
├── .gitignore
├── eslint.config.js
├── index.html         # HTML template
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Reference

- Initial setup based on Vite React TypeScript template
- Logic and structure will be adapted and extended in the actual project phase.

---

## 🧪 Legacy / local-only setup (not using Docker)

_For running the frontend directly on your machine:_

1. Install dependencies:

```bash
npm install
```

2. **Run the frontend in development**

```bash
npm run dev
```

3. **Build the project**

```bash
npm run build
```

4. **Preview the production build**

```bash
npm run preview
```

5. **Run linting**

```bash
npm run lint
```

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and building. Configuration is in `vite.config.ts`.

### TypeScript Configuration
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - App-specific configuration
- `tsconfig.node.json` - Node.js specific configuration

### ESLint Configuration
The project uses ESLint with TypeScript support. Configuration is in `eslint.config.js`.
