/**
 * Delete this after starting the actual project
 */

import { Router } from "express";
import { createTodo, getTodoById, getTodos } from "../handlers/todos";

const router = Router();

router.get("/todos", getTodos);

router.get("/todos/:id", getTodoById);

router.post("/todos", createTodo);

export default router;
