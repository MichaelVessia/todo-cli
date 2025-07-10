import { Effect } from "effect"
import { Todo } from "../../../src/domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError, TodoRepositoryError } from "../../../src/domain/todo/TodoErrors.js"
import { TodoId } from "../../../src/domain/todo/TodoId.js"
import type { TodoRepository } from "../../../src/domain/todo/TodoRepository.js"

export class MockTodoRepository implements TodoRepository {
  private todos: Todo[] = []

  reset(): void {
    this.todos = []
  }

  setTodos(todos: Todo[]): void {
    this.todos = [...todos]
  }

  getTodos(): Todo[] {
    return [...this.todos]
  }

  readonly findById = (id: TodoId): Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: MockTodoRepository) {
      const todo = this.todos.find((t) => TodoId.equals(t.id)(id))
      if (!todo) {
        return yield* Effect.fail(new TodoNotFoundError({ id }))
      }
      return todo
    }.bind(this))

  readonly findAll = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(this.todos)

  readonly save = (todo: Todo): Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: MockTodoRepository) {
      const existingTodo = this.todos.find((t) => TodoId.equals(t.id)(todo.id))
      if (existingTodo) {
        return yield* Effect.fail(new TodoAlreadyExistsError({ id: todo.id }))
      }
      this.todos.push(todo)
      return todo
    }.bind(this))

  readonly update = (todo: Todo): Effect.Effect<Todo, TodoRepositoryError, never> =>
    Effect.gen(function* (this: MockTodoRepository) {
      const index = this.todos.findIndex((t) => TodoId.equals(t.id)(todo.id))
      if (index >= 0) {
        this.todos[index] = todo
      }
      return todo
    }.bind(this))

  readonly deleteById = (id: TodoId): Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: MockTodoRepository) {
      const index = this.todos.findIndex((t) => TodoId.equals(t.id)(id))
      if (index === -1) {
        return yield* Effect.fail(new TodoNotFoundError({ id }))
      }
      this.todos.splice(index, 1)
    }.bind(this))

  readonly findByStatus = (status: Todo["status"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(this.todos.filter((todo) => todo.status === status))

  readonly findByPriority = (priority: Todo["priority"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.succeed(this.todos.filter((todo) => todo.priority === priority))

  readonly count = (): Effect.Effect<number, TodoRepositoryError, never> =>
    Effect.succeed(this.todos.length)
}

export const makeMockTodoRepository = (): MockTodoRepository => new MockTodoRepository()