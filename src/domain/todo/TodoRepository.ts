import { Context, Effect } from "effect"
import { Todo } from "./Todo.js"
import { TodoId } from "./TodoId.js"
import { TodoNotFoundError, TodoRepositoryError, TodoAlreadyExistsError } from "./TodoErrors.js"

export interface TodoRepository {
  readonly findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never>
  readonly findAll: () => Effect.Effect<readonly Todo[], TodoRepositoryError, never>
  readonly save: (todo: Todo) => Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never>
  readonly deleteById: (id: TodoId) => Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never>
  readonly findByStatus: (status: Todo["status"]) => Effect.Effect<readonly Todo[], TodoRepositoryError, never>
  readonly findByPriority: (priority: Todo["priority"]) => Effect.Effect<readonly Todo[], TodoRepositoryError, never>
  readonly count: () => Effect.Effect<number, TodoRepositoryError, never>
}

export const TodoRepository = Context.GenericTag<TodoRepository>("TodoRepository")
