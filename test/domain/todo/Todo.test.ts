import { describe, expect, test } from "bun:test"
import { Effect, TestClock, TestContext } from "effect"

// Helper function to run effects with TestContext
const runTestEffect = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(effect.pipe(Effect.provide(TestContext.TestContext)) as Effect.Effect<A, E, never>)

import { DEFAULT_PRIORITY } from "../../../src/domain/todo/PriorityConstants.js"
import {
  Todo,
  complete,
  equals,
  isCompleted,
  isHighPriority,
  isInProgress,
  isLowPriority,
  isMediumPriority,
  isOverdue,
  isUnstarted,
  makeTodo,
  start,
  toJSON,
  updateDescription,
  updateDueDate,
  updatePriority,
  updateTitle,
} from "../../../src/domain/todo/Todo.js"
import { TodoId } from "../../../src/domain/todo/TodoId.js"

describe("Todo", () => {
  describe("makeTodo", () => {
    test("should create a todo with required fields", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({
          title: "Test Todo",
        })

        expect(todo.title).toBe("Test Todo")
        expect(todo.status).toBe("unstarted")
        expect(todo.priority).toBe(DEFAULT_PRIORITY)
        expect(typeof todo.createdAt).toBe("number")
        expect(typeof todo.updatedAt).toBe("number")
        expect(todo.id).toBeDefined()
        expect(todo.createdAt).toBe(todo.updatedAt)
      })

      await runTestEffect(program)
    })

    test("should create a todo with optional fields", async () => {
      const dueDate = new Date("2024-12-31").getTime()
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({
          title: "Test Todo",
          description: "Test description",
          priority: "high",
          dueDate,
        })

        expect(todo.title).toBe("Test Todo")
        expect(todo.description).toBe("Test description")
        expect(todo.priority).toBe("high")
        expect(todo.dueDate).toBe(dueDate)
      })

      await runTestEffect(program)
    })
  })

  describe("status operations", () => {
    test("complete should mark todo as completed", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const completedTodo = yield* complete(todo)

        expect(completedTodo.status).toBe("completed")
        expect(completedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })

    test("start should mark todo as in_progress", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const startedTodo = yield* start(todo)

        expect(startedTodo.status).toBe("in_progress")
        expect(startedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })
  })

  describe("update operations", () => {
    test("updateTitle should update title and timestamp", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Original Title" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const updatedTodo = yield* updateTitle("New Title")(todo)

        expect(updatedTodo.title).toBe("New Title")
        expect(updatedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })

    test("updateDescription should update description and timestamp", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const updatedTodo = yield* updateDescription("New Description")(todo)

        expect(updatedTodo.description).toBe("New Description")
        expect(updatedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })

    test("updatePriority should update priority and timestamp", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo", priority: "low" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const updatedTodo = yield* updatePriority("high")(todo)

        expect(updatedTodo.priority).toBe("high")
        expect(updatedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })

    test("updateDueDate should update due date and timestamp", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        
        // Advance TestClock to ensure different timestamps
        yield* TestClock.adjust("1 millis")
        
        const newDueDate = new Date("2024-12-31").getTime()
        const updatedTodo = yield* updateDueDate(newDueDate)(todo)

        expect(updatedTodo.dueDate).toBe(newDueDate)
        expect(updatedTodo.updatedAt).toBeGreaterThan(todo.updatedAt)
      })

      await runTestEffect(program)
    })
  })

  describe("status predicates", () => {
    test("isCompleted should return true for completed todos", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        const completedTodo = yield* complete(todo)

        expect(isCompleted(completedTodo)).toBe(true)
        expect(isCompleted(todo)).toBe(false)
      })

      await runTestEffect(program)
    })

    test("isUnstarted should return true for unstarted todos", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        const completedTodo = yield* complete(todo)

        expect(isUnstarted(todo)).toBe(true)
        expect(isUnstarted(completedTodo)).toBe(false)
      })

      await runTestEffect(program)
    })

    test("isInProgress should return true for in-progress todos", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        const inProgressTodo = yield* start(todo)

        expect(isInProgress(inProgressTodo)).toBe(true)
        expect(isInProgress(todo)).toBe(false)
      })

      await runTestEffect(program)
    })
  })

  describe("priority predicates", () => {
    test("isHighPriority should return true for high priority todos", async () => {
      const program = Effect.gen(function* () {
        const highPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "high" })
        const lowPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "low" })

        expect(isHighPriority(highPriorityTodo)).toBe(true)
        expect(isHighPriority(lowPriorityTodo)).toBe(false)
      })

      await runTestEffect(program)
    })

    test("isMediumPriority should return true for medium priority todos", async () => {
      const program = Effect.gen(function* () {
        const mediumPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "medium" })
        const highPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "high" })

        expect(isMediumPriority(mediumPriorityTodo)).toBe(true)
        expect(isMediumPriority(highPriorityTodo)).toBe(false)
      })

      await runTestEffect(program)
    })

    test("isLowPriority should return true for low priority todos", async () => {
      const program = Effect.gen(function* () {
        const lowPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "low" })
        const highPriorityTodo = yield* makeTodo({ title: "Test Todo", priority: "high" })

        expect(isLowPriority(lowPriorityTodo)).toBe(true)
        expect(isLowPriority(highPriorityTodo)).toBe(false)
      })

      await runTestEffect(program)
    })
  })

  describe("isOverdue", () => {
    test("should return true for overdue todos", async () => {
      const program = Effect.gen(function* () {
        // Set initial time
        yield* TestClock.setTime(1000000)
        
        const pastDate = 500000 // Earlier timestamp
        const overdueTodo = yield* makeTodo({
          title: "Test Todo",
          dueDate: pastDate,
        })

        const result = yield* isOverdue(overdueTodo)
        expect(result).toBe(true)
      })

      await runTestEffect(program)
    })

    test("should return false for future due dates", async () => {
      const program = Effect.gen(function* () {
        // Set initial time
        yield* TestClock.setTime(1000000)
        
        const futureDate = 2000000 // Later timestamp
        const futureTodo = yield* makeTodo({
          title: "Test Todo",
          dueDate: futureDate,
        })

        const result = yield* isOverdue(futureTodo)
        expect(result).toBe(false)
      })

      await runTestEffect(program)
    })

    test("should return false for completed todos even if overdue", async () => {
      const program = Effect.gen(function* () {
        // Set initial time
        yield* TestClock.setTime(1000000)
        
        const pastDate = 500000 // Earlier timestamp
        const overdueTodo = yield* makeTodo({
          title: "Test Todo",
          dueDate: pastDate,
        })
        const completedTodo = yield* complete(overdueTodo)

        const result = yield* isOverdue(completedTodo)
        expect(result).toBe(false)
      })

      await runTestEffect(program)
    })

    test("should return false for todos without due date", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })

        const result = yield* isOverdue(todo)
        expect(result).toBe(false)
      })

      await runTestEffect(program)
    })
  })

  describe("equals", () => {
    test("should return true for todos with same ID", async () => {
      const program = Effect.gen(function* () {
        const todo1 = yield* makeTodo({ title: "Test Todo" })
        const todo2 = new Todo({ ...todo1, title: "Different Title" })

        expect(equals(todo1)(todo2)).toBe(true)
      })

      await runTestEffect(program)
    })

    test("should return false for todos with different IDs", async () => {
      const program = Effect.gen(function* () {
        const todo1 = yield* makeTodo({ title: "Test Todo" })
        const todo2 = yield* makeTodo({ title: "Test Todo" })

        expect(equals(todo1)(todo2)).toBe(false)
      })

      await runTestEffect(program)
    })
  })

  describe("toJSON", () => {
    test("should convert todo to JSON format", async () => {
      const program = Effect.gen(function* () {
        const dueDate = new Date("2024-12-31").getTime()
        const todo = yield* makeTodo({
          title: "Test Todo",
          description: "Test description",
          priority: "high",
          dueDate,
        })

        const json = toJSON(todo)

        expect(json).toEqual({
          id: TodoId.toString(todo.id),
          title: "Test Todo",
          description: "Test description",
          status: "unstarted",
          priority: "high",
          createdAt: new Date(todo.createdAt).toISOString(),
          updatedAt: new Date(todo.updatedAt).toISOString(),
          dueDate: new Date(dueDate).toISOString(),
        })
      })

      await runTestEffect(program)
    })

    test("should handle optional fields in JSON format", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Test Todo" })
        const json = toJSON(todo)

        expect(json).toEqual({
          id: TodoId.toString(todo.id),
          title: "Test Todo",
          description: undefined,
          status: "unstarted",
          priority: DEFAULT_PRIORITY,
          createdAt: new Date(todo.createdAt).toISOString(),
          updatedAt: new Date(todo.updatedAt).toISOString(),
          dueDate: undefined,
        })
      })

      await runTestEffect(program)
    })
  })
})