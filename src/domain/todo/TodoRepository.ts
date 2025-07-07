import { Context, Effect } from "effect"
import { Todo } from "./Todo.js"
import { TodoId } from "./TodoId.js"

export interface TodoRepository {
  readonly findById: (id: TodoId) => Effect.Effect<Todo | null, never, never>
  readonly findAll: () => Effect.Effect<readonly Todo[], never, never>
  readonly save: (todo: Todo) => Effect.Effect<Todo, never, never>
  readonly deleteById: (id: TodoId) => Effect.Effect<boolean, never, never>
  readonly findByStatus: (status: Todo["status"]) => Effect.Effect<readonly Todo[], never, never>
  readonly findByPriority: (priority: Todo["priority"]) => Effect.Effect<readonly Todo[], never, never>
  readonly count: () => Effect.Effect<number, never, never>
}

export const TodoRepository = Context.GenericTag<TodoRepository>("TodoRepository")
