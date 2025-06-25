import { Router } from "express";
import { createTodo, getTodoById, getTodos } from "../handlers/todos";
import { getUsers } from "../handlers/users";

const router = Router();

router.get("/users", getUsers);

export default router;
