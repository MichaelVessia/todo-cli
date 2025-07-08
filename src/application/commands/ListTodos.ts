import { Effect } from "effect"
import { type Todo } from "../../domain/todo/Todo.js"
import type { TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { TodoRepository } from "../../domain/todo/TodoRepository.js"

export const getTodos = (): Effect.Effect<ReadonlyArray<Todo>, TodoRepositoryError, TodoRepository> =>
  Effect.gen(function* () {
    const repository = yield* TodoRepository

    const todos = yield* repository.findAll()

    return todos
  })
