import { Effect } from "effect"
import { makeTodo } from "../domain/todo/Todo.js"
import { TodoValidationError } from "../domain/todo/TodoErrors.js"
import { TodoRepository } from "../domain/todo/TodoRepository.js"

export interface AddTodoCommand {
  readonly title: string
  readonly description: string
  readonly priority: "low" | "medium" | "high"
  readonly dueDate: Date
}

export const addTodo = (
  command: AddTodoCommand
) =>
  Effect.gen(function*() {
    if (!command.title.trim()) {
      return yield* Effect.fail(
        new TodoValidationError({
          field: "title",
          reason: "Title cannot be empty"
        })
      )
    }

    const todo = makeTodo({
      title: command.title,
      description: command.description,
      priority: command.priority,
      dueDate: command.dueDate
    })

    const repository = yield* TodoRepository

    const savedTodo = yield* repository.save(todo)

    return savedTodo
  })
