import express from "express";
import todoRouter from "./routes/todos";

export function createApp() {
  const app = express();

  // Middleware to parse JSON
  app.use(express.json());

  app.use("/api/todos", todoRouter);
  return app;
}
