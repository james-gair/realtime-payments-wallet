import { Request, Response } from "express";
import { CreateTodoDto } from "../dtos/CreateTodo.dto";
import { CreateTodoQueryParams } from "../types/query-params";
import { Todo } from "../types/response";

export function getTodos(req: Request, res: Response) {
  res.send([]);
}

export function getTodoById(req: Request, res: Response) {
  res.send({});
}

export function createTodo(
  req: Request<{}, {}, CreateTodoDto, CreateTodoQueryParams>,
  res: Response<Todo>
) {
  // req.body.todoContent;
  // req.query.highlight;
  res.status(201).send({
    id: "jfksk",
  });
}
