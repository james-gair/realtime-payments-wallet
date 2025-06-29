import { Router } from "express";
import { createTodo, getTodoById, getTodos } from "../handlers/todos";
import { addUsers, deleteUsers, getUsers } from "../handlers/users";

const router = Router();

router.get("/users", getUsers);
router.post("/users", addUsers);
router.delete("/users", deleteUsers);
export default router;
