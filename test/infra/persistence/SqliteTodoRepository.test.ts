import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Effect, Layer } from "effect"
import { Todo } from "../../../src/domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError } from "../../../src/domain/todo/TodoErrors.js"
import { TodoId } from "../../../src/domain/todo/TodoId.js"
import { TodoRepository } from "../../../src/domain/todo/TodoRepository.js"
import { SqliteTest } from "../../../src/infra/persistence/SqliteTodoRepository.js"

describe("SqliteTodoRepository", () => {
  let repository: TodoRepository

  beforeAll(async () => {
    const program = Effect.gen(function* () {
      return yield* TodoRepository
    }).pipe(Effect.provide(SqliteTest))

    repository = await Effect.runPromise(program)
  })

  afterAll(async () => {
    // Clean up any remaining todos
    const program = Effect.gen(function* () {
      const todos = yield* repository.findAll()
      for (const todo of todos) {
        yield* repository.deleteById(todo.id)
      }
    })
    await Effect.runPromise(program)
  })

  test("should save and retrieve a todo", async () => {
    const todo = new Todo({
      title: "Test Todo",
      description: "Test Description",
      status: "pending",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      const saved = yield* repository.save(todo)
      expect(saved.title).toBe("Test Todo")
      
      const retrieved = yield* repository.findById(saved.id)
      expect(retrieved.title).toBe("Test Todo")
      expect(retrieved.description).toBe("Test Description")
      expect(retrieved.status).toBe("pending")
      expect(retrieved.priority).toBe("medium")
      
      // Clean up
      yield* repository.deleteById(saved.id)
    })

    await Effect.runPromise(program)
  })

  test("should list all todos", async () => {
    const todo1 = new Todo({ title: "Todo 1", status: "pending", priority: "high" })
    const todo2 = new Todo({ title: "Todo 2", status: "in_progress", priority: "low" })

    const program = Effect.gen(function* () {
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      const todos = yield* repository.findAll()
      expect(todos.length).toBeGreaterThanOrEqual(2)
      
      // Clean up
      yield* repository.deleteById(todo1.id)
      yield* repository.deleteById(todo2.id)
    })

    await Effect.runPromise(program)
  })

  test("should update a todo", async () => {
    const todo = new Todo({
      title: "Original Title",
      status: "pending",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      yield* repository.save(todo)
      
      const updated = new Todo({
        ...todo,
        title: "Updated Title",
        status: "completed"
      })
      
      yield* repository.update(updated)
      
      const retrieved = yield* repository.findById(todo.id)
      expect(retrieved.title).toBe("Updated Title")
      expect(retrieved.status).toBe("completed")
      
      // Clean up
      yield* repository.deleteById(todo.id)
    })

    await Effect.runPromise(program)
  })

  test("should delete a todo", async () => {
    const todo = new Todo({
      title: "To Delete",
      status: "pending",
      priority: "low"
    })

    const program = Effect.gen(function* () {
      yield* repository.save(todo)
      yield* repository.deleteById(todo.id)
      
      const result = yield* Effect.either(repository.findById(todo.id))
      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TodoNotFoundError)
      }
    })

    await Effect.runPromise(program)
  })

  test("should not save duplicate todo", async () => {
    const todo = new Todo({
      title: "Duplicate Test",
      status: "pending",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      yield* repository.save(todo)
      
      const result = yield* Effect.either(repository.save(todo))
      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TodoAlreadyExistsError)
      }
      
      // Clean up
      yield* repository.deleteById(todo.id)
    })

    await Effect.runPromise(program)
  })

  test("should find todos by status", async () => {
    const pending = new Todo({ title: "Pending", status: "pending", priority: "medium" })
    const inProgress = new Todo({ title: "In Progress", status: "in_progress", priority: "high" })
    const completed = new Todo({ title: "Completed", status: "completed", priority: "low" })

    const program = Effect.gen(function* () {
      yield* repository.save(pending)
      yield* repository.save(inProgress)
      yield* repository.save(completed)
      
      const pendingTodos = yield* repository.findByStatus("pending")
      const inProgressTodos = yield* repository.findByStatus("in_progress")
      const completedTodos = yield* repository.findByStatus("completed")
      
      expect(pendingTodos.some(t => t.id === pending.id)).toBe(true)
      expect(inProgressTodos.some(t => t.id === inProgress.id)).toBe(true)
      expect(completedTodos.some(t => t.id === completed.id)).toBe(true)
      
      // Clean up
      yield* repository.deleteById(pending.id)
      yield* repository.deleteById(inProgress.id)
      yield* repository.deleteById(completed.id)
    })

    await Effect.runPromise(program)
  })

  test("should find todos by priority", async () => {
    const high = new Todo({ title: "High", status: "pending", priority: "high" })
    const medium = new Todo({ title: "Medium", status: "pending", priority: "medium" })
    const low = new Todo({ title: "Low", status: "pending", priority: "low" })

    const program = Effect.gen(function* () {
      yield* repository.save(high)
      yield* repository.save(medium)
      yield* repository.save(low)
      
      const highPriority = yield* repository.findByPriority("high")
      const mediumPriority = yield* repository.findByPriority("medium")
      const lowPriority = yield* repository.findByPriority("low")
      
      expect(highPriority.some(t => t.id === high.id)).toBe(true)
      expect(mediumPriority.some(t => t.id === medium.id)).toBe(true)
      expect(lowPriority.some(t => t.id === low.id)).toBe(true)
      
      // Clean up
      yield* repository.deleteById(high.id)
      yield* repository.deleteById(medium.id)
      yield* repository.deleteById(low.id)
    })

    await Effect.runPromise(program)
  })

  test("should count todos", async () => {
    const program = Effect.gen(function* () {
      const initialCount = yield* repository.count()
      
      const todo1 = new Todo({ title: "Count 1", status: "pending", priority: "medium" })
      const todo2 = new Todo({ title: "Count 2", status: "pending", priority: "medium" })
      
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      const newCount = yield* repository.count()
      expect(newCount).toBe(initialCount + 2)
      
      // Clean up
      yield* repository.deleteById(todo1.id)
      yield* repository.deleteById(todo2.id)
    })

    await Effect.runPromise(program)
  })
})