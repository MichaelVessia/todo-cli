import { Effect } from "effect"
import type { Todo } from "../../domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError, type TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { TodoId } from "../../domain/todo/TodoId.js"
import type { TodoRepository } from "../../domain/todo/TodoRepository.js"

export class MemoryTodoRepository implements TodoRepository {
  private todos: Map<string, Todo> = new Map()

  readonly findById = (id: TodoId): Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const todo = this.todos.get(TodoId.toString(id))

        if (!todo) {
          return yield* Effect.fail(new TodoNotFoundError({ id }))
        }

        return todo
      }.bind(this)
    )

  readonly findAll = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(Array.from(this.todos.values()))

  readonly save = (todo: Todo): Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const idString = TodoId.toString(todo.id)

        if (this.todos.has(idString)) {
          return yield* Effect.fail(new TodoAlreadyExistsError({ id: todo.id }))
        }

        this.todos.set(idString, todo)
        return todo
      }.bind(this)
    )

  readonly update = (todo: Todo): Effect.Effect<Todo, TodoRepositoryError, never> =>
    Effect.sync(() => {
      const idString = TodoId.toString(todo.id)
      this.todos.set(idString, todo)
      return todo
    })

  readonly deleteById = (id: TodoId): Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const idString = TodoId.toString(id)

        if (!this.todos.has(idString)) {
          return yield* Effect.fail(new TodoNotFoundError({ id }))
        }

        this.todos.delete(idString)
      }.bind(this)
    )

  readonly findByStatus = (status: Todo["status"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(Array.from(this.todos.values()).filter((todo) => todo.status === status))

  readonly findByPriority = (priority: Todo["priority"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(Array.from(this.todos.values()).filter((todo) => todo.priority === priority))

  readonly count = (): Effect.Effect<number, TodoRepositoryError, never> => Effect.succeed(this.todos.size)
}

export const make = (): TodoRepository => new MemoryTodoRepository()
