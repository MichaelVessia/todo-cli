import { Effect } from "effect"
import { type Todo } from "../../domain/todo/Todo.js"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"
import { TodoRepositoryError } from "../../domain/todo/TodoErrors.js"

export type ListTodosError = TodoRepositoryError

export const getTodos = (
): Effect.Effect<readonly Todo[], TodoRepositoryError, TodoRepository> =>
  Effect.gen(function* () {
    const repository = yield* TodoRepository

    const todos = yield* repository.findAll()

    return todos
  })
