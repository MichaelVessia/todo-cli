import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { Schema } from "@effect/schema"
import { DateTime, Effect } from "effect"
import { Todo, TodoSchema, toJSON } from "../../domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError, TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { TodoId } from "../../domain/todo/TodoId.js"
import type { TodoRepository } from "../../domain/todo/TodoRepository.js"

const TodoPersistenceModel = Schema.Array(TodoSchema)

export class JsonTodoRepository implements TodoRepository {
  constructor(private readonly filePath: string) { }

  private readonly readTodos = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const fs = yield* FileSystem.FileSystem

      const fileExists = yield* fs.exists(this.filePath).pipe(
        Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
      )
      if (!fileExists) {
        return []
      }

      const content = yield* fs.readFileString(this.filePath).pipe(
        Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
      )
      if (!content.trim()) {
        return []
      }

      try {
        const parsed = JSON.parse(content)
        const decoded = yield* Schema.decodeUnknown(TodoPersistenceModel)(parsed).pipe(
          Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
        )
        return decoded.map((data) => {
          const todoData = {
            id: data.id,
            title: data.title,
            status: data.status,
            priority: data.priority,
            createdAt: DateTime.toDate(data.createdAt),
            updatedAt: DateTime.toDate(data.updatedAt),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.dueDate !== undefined ? { dueDate: DateTime.toDate(data.dueDate) } : {})
          }
          return new Todo(todoData)
        })
      } catch (error) {
        return yield* Effect.fail(
          new TodoRepositoryError({
            cause: error
          })
        )
      }
    }.bind(this)).pipe(Effect.provide(BunFileSystem.layer))

  private readonly writeTodos = (todos: readonly Todo[]): Effect.Effect<void, TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const fs = yield* FileSystem.FileSystem

      try {
        const jsonData = JSON.stringify(todos.map((todo) => toJSON(todo)), null, 2)
        yield* fs.writeFileString(this.filePath, jsonData).pipe(
          Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
        )
      } catch (error) {
        return yield* Effect.fail(
          new TodoRepositoryError({
            cause: error
          })
        )
      }
    }.bind(this)).pipe(Effect.provide(BunFileSystem.layer))

  readonly findById = (id: TodoId): Effect.Effect<Todo, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      const todo = todos.find((t: Todo) => TodoId.equals(t.id)(id))

      if (!todo) {
        return yield* Effect.fail(new TodoNotFoundError({ id }))
      }

      return todo
    }.bind(this))

  readonly findAll = (): Effect.Effect<readonly Todo[], TodoRepositoryError, never> => this.readTodos()

  readonly save = (todo: Todo): Effect.Effect<Todo, TodoAlreadyExistsError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      const existingIndex = todos.findIndex((t: Todo) => TodoId.equals(t.id)(todo.id))

      if (existingIndex >= 0) {
        return yield* Effect.fail(new TodoAlreadyExistsError({ id: todo.id }))
      }

      const updatedTodos = [...todos, todo]
      yield* this.writeTodos(updatedTodos)
      return todo
    }.bind(this))

  readonly update = (todo: Todo): Effect.Effect<Todo, TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      const updatedTodos = [...todos].map(existingTodo => existingTodo.id === todo.id ? todo : existingTodo)
      yield* this.writeTodos(updatedTodos)
      return todo
    }.bind(this))

  readonly deleteById = (id: TodoId): Effect.Effect<void, TodoNotFoundError | TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      const todoIndex = todos.findIndex((t: Todo) => TodoId.equals(t.id)(id))

      if (todoIndex === -1) {
        return yield* Effect.fail(new TodoNotFoundError({ id }))
      }

      const updatedTodos = todos.filter((_: Todo, index: number) => index !== todoIndex)
      yield* this.writeTodos(updatedTodos)
    }.bind(this))

  readonly findByStatus = (status: Todo["status"]): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      return todos.filter((todo: Todo) => todo.status === status)
    }.bind(this))

  readonly findByPriority = (
    priority: Todo["priority"]
  ): Effect.Effect<readonly Todo[], TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      return todos.filter((todo: Todo) => todo.priority === priority)
    }.bind(this))

  readonly count = (): Effect.Effect<number, TodoRepositoryError, never> =>
    Effect.gen(function* (this: JsonTodoRepository) {
      const todos = yield* this.readTodos()
      return todos.length
    }.bind(this))
}

export const make = (filePath: string): TodoRepository => new JsonTodoRepository(filePath)
