import { Effect } from "effect"
import { make as makeTodo, type Todo } from "../../domain/todo/Todo.js"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"
import { TodoAlreadyExistsError, TodoRepositoryError, TodoValidationError } from "../../domain/todo/TodoErrors.js"

export interface AddTodoCommand {
  readonly title: string
  readonly description: string
  readonly priority: "low" | "medium" | "high"
  readonly dueDate: Date
}

export type AddTodoError = TodoValidationError | TodoAlreadyExistsError | TodoRepositoryError

export const addTodo = (
  command: AddTodoCommand
): Effect.Effect<Todo, AddTodoError, TodoRepository> =>
  Effect.gen(function* () {
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
