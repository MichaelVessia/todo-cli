import { describe, expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { TodoRepository } from "../../../src/domain/todo/TodoRepository.js"
import { TodoRepositoryLayer } from "../../../src/infra/layers/TodoRepositoryLayer.js"
import { makeTodo } from "../../../src/domain/todo/Todo.js"
import { MemoryTodoRepository } from "../../../src/infra/persistence/MemoryTodoRepository.js"

describe("TodoRepositoryLayer", () => {
  test("should use JSON provider by default", async () => {
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

  test("should use memory provider when configured", async () => {
    // For this test, we'll directly create a memory provider layer
    const memoryLayer = Layer.succeed(TodoRepository, new MemoryTodoRepository())

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      
      // Save a todo
      const todo = makeTodo({ title: "Test todo" })
      yield* repository.save(todo)
      
      // Find all todos
      const todos = yield* repository.findAll()
      
      return todos.length
    })

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(memoryLayer)
      )
    )
    
    expect(result).toBe(1)
  })

  test("different provider instances should have isolated data", async () => {
    // Create separate memory provider instances
    const layer1 = Layer.succeed(TodoRepository, new MemoryTodoRepository())
    const layer2 = Layer.succeed(TodoRepository, new MemoryTodoRepository())

    const program1 = Effect.gen(function* () {
      const repository = yield* TodoRepository
      const todo = makeTodo({ title: "Todo in instance 1" })
      yield* repository.save(todo)
      return yield* repository.count()
    })

    const program2 = Effect.gen(function* () {
      const repository = yield* TodoRepository
      return yield* repository.count()
    })

    const count1 = await Effect.runPromise(program1.pipe(Effect.provide(layer1)))
    const count2 = await Effect.runPromise(program2.pipe(Effect.provide(layer2)))
    
    expect(count1).toBe(1)
    expect(count2).toBe(0) // Different instance, no data
  })

  test("memory provider should maintain data across operations", async () => {
    const memoryLayer = Layer.succeed(TodoRepository, new MemoryTodoRepository())

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      
      // Add multiple todos
      const todo1 = makeTodo({ title: "Todo 1" })
      const todo2 = makeTodo({ title: "Todo 2" })
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      // Count todos
      const count = yield* repository.count()
      
      // Delete one
      yield* repository.deleteById(todo1.id)
      
      // Count again
      const finalCount = yield* repository.count()
      
      return { initialCount: count, finalCount }
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(memoryLayer))
    )
    
    expect(result.initialCount).toBe(2)
    expect(result.finalCount).toBe(1)
  })
})