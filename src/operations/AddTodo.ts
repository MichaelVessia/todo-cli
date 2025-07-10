import { Effect } from "effect"
import { makeTodo } from "../domain/todo/Todo.js"
import { TodoValidationError } from "../domain/todo/TodoErrors.js"
import { TodoRepository } from "../domain/todo/TodoRepository.js"

export interface AddTodoCommand {
  readonly title: string
  readonly description?: string | undefined
  readonly priority: "low" | "medium" | "high"
  readonly dueDate?: number | undefined
}

export const addTodo = (command: AddTodoCommand) =>
  Effect.gen(function* () {
    if (!command.title.trim()) {
      return yield* Effect.fail(
        new TodoValidationError({
          field: "title",
          reason: "Title cannot be empty"
        })
      )
    }

    const todo = yield* makeTodo({
      title: command.title,
      ...(command.description ? { description: command.description } : {}),
      priority: command.priority,
      ...(command.dueDate ? { dueDate: command.dueDate } : {})
    })

    const repository = yield* TodoRepository

    const savedTodo = yield* repository.save(todo)

    return savedTodo
  })
