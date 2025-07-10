import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { Todo, makeTodo } from "../../../src/domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError } from "../../../src/domain/todo/TodoErrors.js"
import { TodoRepository } from "../../../src/domain/todo/TodoRepository.js"
import { SqliteTest } from "../../../src/infra/persistence/SqliteTodoRepository.js"

describe("SqliteTodoRepository", () => {

  test("should save and retrieve a todo", async () => {
    const todo = makeTodo({
      title: "Test Todo",
      description: "Test Description",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      const saved = yield* repository.save(todo)
      expect(saved.title).toBe("Test Todo")
      
      const retrieved = yield* repository.findById(saved.id)
      expect(retrieved.title).toBe("Test Todo")
      expect(retrieved.description).toBe("Test Description")
      expect(retrieved.status).toBe("unstarted")
      expect(retrieved.priority).toBe("medium")
      
      // Clean up
      yield* repository.deleteById(saved.id)
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should list all todos", async () => {
    const todo1 = makeTodo({ title: "Todo 1", priority: "high" })
    const todo2 = new Todo({ ...makeTodo({ title: "Todo 2", priority: "low" }), status: "in_progress" })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      const todos = yield* repository.findAll()
      expect(todos.length).toBeGreaterThanOrEqual(2)
      
      // Clean up
      yield* repository.deleteById(todo1.id)
      yield* repository.deleteById(todo2.id)
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should update a todo", async () => {
    const todo = makeTodo({
      title: "Original Title",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
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

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should delete a todo", async () => {
    const todo = makeTodo({
      title: "To Delete",
      priority: "low"
    })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      yield* repository.save(todo)
      yield* repository.deleteById(todo.id)
      
      const result = yield* Effect.either(repository.findById(todo.id))
      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TodoNotFoundError)
      }
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should not save duplicate todo", async () => {
    const todo = makeTodo({
      title: "Duplicate Test",
      priority: "medium"
    })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      yield* repository.save(todo)
      
      const result = yield* Effect.either(repository.save(todo))
      expect(result._tag).toBe("Left")
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TodoAlreadyExistsError)
      }
      
      // Clean up
      yield* repository.deleteById(todo.id)
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should find todos by status", async () => {
    const unstarted = makeTodo({ title: "Unstarted", priority: "medium" })
    const inProgress = new Todo({ ...makeTodo({ title: "In Progress", priority: "high" }), status: "in_progress" })
    const completed = new Todo({ ...makeTodo({ title: "Completed", priority: "low" }), status: "completed" })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      yield* repository.save(unstarted)
      yield* repository.save(inProgress)
      yield* repository.save(completed)
      
      const unstartedTodos = yield* repository.findByStatus("unstarted")
      const inProgressTodos = yield* repository.findByStatus("in_progress")
      const completedTodos = yield* repository.findByStatus("completed")
      
      expect(unstartedTodos.some(t => t.id === unstarted.id)).toBe(true)
      expect(inProgressTodos.some(t => t.id === inProgress.id)).toBe(true)
      expect(completedTodos.some(t => t.id === completed.id)).toBe(true)
      
      // Clean up
      yield* repository.deleteById(unstarted.id)
      yield* repository.deleteById(inProgress.id)
      yield* repository.deleteById(completed.id)
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should find todos by priority", async () => {
    const high = makeTodo({ title: "High", priority: "high" })
    const medium = makeTodo({ title: "Medium", priority: "medium" })
    const low = makeTodo({ title: "Low", priority: "low" })

    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
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

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })

  test("should count todos", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository
      const initialCount = yield* repository.count()
      
      const todo1 = makeTodo({ title: "Count 1", priority: "medium" })
      const todo2 = makeTodo({ title: "Count 2", priority: "medium" })
      
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      
      const newCount = yield* repository.count()
      expect(newCount).toBe(initialCount + 2)
      
      // Clean up
      yield* repository.deleteById(todo1.id)
      yield* repository.deleteById(todo2.id)
    })

    await Effect.runPromise(program.pipe(Effect.provide(SqliteTest)))
  })
})