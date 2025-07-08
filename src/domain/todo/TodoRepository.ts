import type { Effect } from "effect"
import { Context } from "effect"
import type { Todo } from "./Todo.js"
import type { TodoAlreadyExistsError, TodoNotFoundError, TodoRepositoryError } from "./TodoErrors.js"
import type { TodoId } from "./TodoId.js"

export interface TodoRepository {
  readonly findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never>
  readonly findAll: () => Effect.Effect<ReadonlyArray<Todo>, TodoRepositoryError, never>
  readonly save: (todo: Todo) => Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never>
  readonly update: (todo: Todo) => Effect.Effect<Todo, TodoRepositoryError, never>
  readonly deleteById: (id: TodoId) => Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never>
  readonly findByStatus: (status: Todo["status"]) => Effect.Effect<ReadonlyArray<Todo>, TodoRepositoryError, never>
  readonly findByPriority: (
    priority: Todo["priority"]
  ) => Effect.Effect<ReadonlyArray<Todo>, TodoRepositoryError, never>
  readonly count: () => Effect.Effect<number, TodoRepositoryError, never>
}

export const TodoRepository = Context.GenericTag<TodoRepository>("TodoRepository")
