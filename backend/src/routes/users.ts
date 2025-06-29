import { Router } from "express";
import { createTodo, getTodoById, getTodos } from "../handlers/todos";
import { addUsers, deleteUsers, getUsers } from "../handlers/users";

// This is an example route used to test the backend and database connection.
// Authentication is handled by the Firebase API.
// Delete this file when actual development begins.

const router = Router();

router.get("/users", getUsers);
router.post("/users", addUsers);
router.delete("/users", deleteUsers);
export default router;
