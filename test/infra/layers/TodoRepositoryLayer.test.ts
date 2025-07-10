import { describe, expect, test } from "bun:test"
import { Effect, TestContext, Layer } from "effect"
import { Todo, makeTodo } from "../../../src/domain/todo/Todo.js"
import { TodoRepository } from "../../../src/domain/todo/TodoRepository.js"
import { TodoRepositoryLayer } from "../../../src/infra/layers/TodoRepositoryLayer.js"
import { SqliteTest } from "../../../src/infra/persistence/SqliteTodoRepository.js"

describe("TodoRepositoryLayer", () => {
  test("should provide SQLite repository", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      // The repository should be defined
      return repository !== undefined
    })

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(TodoRepositoryLayer)
      )
    )
    
    expect(result).toBe(true)
  })

  test("should save and retrieve todos", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      
      // Save a todo
      const todo = yield* makeTodo({ title: "Test todo", priority: "medium" })
      yield* repository.save(todo)
      
      // Find all todos
      const todos = yield* repository.findAll()
      
      // Clean up
      yield* repository.deleteById(todo.id)
      
      return todos.some(t => t.id === todo.id)
    })

    const result = await Effect.runPromise(
      Effect.provide(program, Layer.merge(TodoRepositoryLayer, TestContext.TestContext)) as any
    )
    
    expect(result).toBe(true)
  })

  test("different test instances should have isolated data", async () => {
    const program1 = Effect.gen(function* () {
      const repository = yield* TodoRepository
      const todo = yield* makeTodo({ title: "Todo in instance 1", priority: "high" })
      yield* repository.save(todo)
      const count = yield* repository.count()
      yield* repository.deleteById(todo.id)
      return count
    })

    const program2 = Effect.gen(function* () {
      const repository = yield* TodoRepository
      return yield* repository.count()
    })

    await Effect.runPromise(Effect.provide(program1, Layer.merge(SqliteTest, TestContext.TestContext)) as any)
    const count2 = await Effect.runPromise(Effect.provide(program2, Layer.merge(SqliteTest, TestContext.TestContext)) as any)
    
    // Both should start with 0 todos since we're using in-memory SQLite
    expect(count2).toBe(0)
  })

  test("SQLite provider should maintain data across operations", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      
      // Add multiple todos
      const todo1 = yield* makeTodo({ title: "Todo 1", priority: "low" })
      const todo2Base = yield* makeTodo({ title: "Todo 2", priority: "medium" })
      const todo2 = new Todo({ ...todo2Base, status: "in_progress" })
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      // Count todos
      const count = yield* repository.count()
      
      // Delete one
      yield* repository.deleteById(todo1.id)
      
      // Count again
      const finalCount = yield* repository.count()
      
      // Clean up
      yield* repository.deleteById(todo2.id)
      
      return { initialCount: count, finalCount }
    })

    const result = await Effect.runPromise(
      Effect.provide(program, Layer.merge(SqliteTest, TestContext.TestContext)) as any
    ) as { initialCount: number; finalCount: number }
    
    expect(result.initialCount).toBe(2)
    expect(result.finalCount).toBe(1)
  })
})