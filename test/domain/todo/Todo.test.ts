import { describe, expect, test } from "bun:test"
import { DateTime } from "effect"
import { DEFAULT_PRIORITY, PRIORITY_VALUES } from "../../../src/domain/todo/PriorityConstants.js"
import {
  Todo,
  TodoPriority,
  TodoStatus,
  complete,
  equals,
  isCompleted,
  isHighPriority,
  isInProgress,
  isLowPriority,
  isMediumPriority,
  isOverdue,
  isPending,
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
    test("should create a todo with required fields", () => {
      const todo = makeTodo({
        title: "Test Todo",
      })

      expect(todo.title).toBe("Test Todo")
      expect(todo.status).toBe("pending")
      expect(todo.priority).toBe(DEFAULT_PRIORITY)
      expect(todo.createdAt).toBeInstanceOf(Date)
      expect(todo.updatedAt).toBeInstanceOf(Date)
      expect(todo.id).toBeDefined()
    })

    test("should create a todo with optional fields", () => {
      const dueDate = new Date("2024-12-31")
      const todo = makeTodo({
        title: "Test Todo",
        description: "Test description",
        priority: "high",
        dueDate,
      })

      expect(todo.title).toBe("Test Todo")
      expect(todo.description).toBe("Test description")
      expect(todo.priority).toBe("high")
      expect(todo.dueDate).toEqual(dueDate)
    })
  })

  describe("status operations", () => {
    test("complete should mark todo as completed", async () => {
      const todo = makeTodo({ title: "Test Todo" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const completedTodo = complete(todo)

      expect(completedTodo.status).toBe("completed")
      expect(completedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })

    test("start should mark todo as in_progress", async () => {
      const todo = makeTodo({ title: "Test Todo" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const startedTodo = start(todo)

      expect(startedTodo.status).toBe("in_progress")
      expect(startedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })
  })

  describe("update operations", () => {
    test("updateTitle should update title and timestamp", async () => {
      const todo = makeTodo({ title: "Original Title" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const updatedTodo = updateTitle("New Title")(todo)

      expect(updatedTodo.title).toBe("New Title")
      expect(updatedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })

    test("updateDescription should update description and timestamp", async () => {
      const todo = makeTodo({ title: "Test Todo" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const updatedTodo = updateDescription("New Description")(todo)

      expect(updatedTodo.description).toBe("New Description")
      expect(updatedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })

    test("updatePriority should update priority and timestamp", async () => {
      const todo = makeTodo({ title: "Test Todo", priority: "low" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const updatedTodo = updatePriority("high")(todo)

      expect(updatedTodo.priority).toBe("high")
      expect(updatedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })

    test("updateDueDate should update due date and timestamp", async () => {
      const todo = makeTodo({ title: "Test Todo" })
      await new Promise(resolve => setTimeout(resolve, 1))
      const newDueDate = new Date("2024-12-31")
      const updatedTodo = updateDueDate(newDueDate)(todo)

      expect(updatedTodo.dueDate).toEqual(newDueDate)
      expect(updatedTodo.updatedAt.getTime()).toBeGreaterThan(todo.updatedAt.getTime())
    })
  })

  describe("status predicates", () => {
    test("isCompleted should return true for completed todos", () => {
      const todo = makeTodo({ title: "Test Todo" })
      const completedTodo = complete(todo)

      expect(isCompleted(completedTodo)).toBe(true)
      expect(isCompleted(todo)).toBe(false)
    })

    test("isPending should return true for pending todos", () => {
      const todo = makeTodo({ title: "Test Todo" })
      const completedTodo = complete(todo)

      expect(isPending(todo)).toBe(true)
      expect(isPending(completedTodo)).toBe(false)
    })

    test("isInProgress should return true for in-progress todos", () => {
      const todo = makeTodo({ title: "Test Todo" })
      const inProgressTodo = start(todo)

      expect(isInProgress(inProgressTodo)).toBe(true)
      expect(isInProgress(todo)).toBe(false)
    })
  })

  describe("priority predicates", () => {
    test("isHighPriority should return true for high priority todos", () => {
      const highPriorityTodo = makeTodo({ title: "Test Todo", priority: "high" })
      const lowPriorityTodo = makeTodo({ title: "Test Todo", priority: "low" })

      expect(isHighPriority(highPriorityTodo)).toBe(true)
      expect(isHighPriority(lowPriorityTodo)).toBe(false)
    })

    test("isMediumPriority should return true for medium priority todos", () => {
      const mediumPriorityTodo = makeTodo({ title: "Test Todo", priority: "medium" })
      const highPriorityTodo = makeTodo({ title: "Test Todo", priority: "high" })

      expect(isMediumPriority(mediumPriorityTodo)).toBe(true)
      expect(isMediumPriority(highPriorityTodo)).toBe(false)
    })

    test("isLowPriority should return true for low priority todos", () => {
      const lowPriorityTodo = makeTodo({ title: "Test Todo", priority: "low" })
      const highPriorityTodo = makeTodo({ title: "Test Todo", priority: "high" })

      expect(isLowPriority(lowPriorityTodo)).toBe(true)
      expect(isLowPriority(highPriorityTodo)).toBe(false)
    })
  })

  describe("isOverdue", () => {
    test("should return true for overdue todos", () => {
      const pastDate = new Date(Date.now() - 86400000) // 1 day ago
      const overdueTodo = makeTodo({
        title: "Test Todo",
        dueDate: pastDate,
      })

      expect(isOverdue(overdueTodo)).toBe(true)
    })

    test("should return false for future due dates", () => {
      const futureDate = new Date(Date.now() + 86400000) // 1 day from now
      const futureTodo = makeTodo({
        title: "Test Todo",
        dueDate: futureDate,
      })

      expect(isOverdue(futureTodo)).toBe(false)
    })

    test("should return false for completed todos even if overdue", () => {
      const pastDate = new Date(Date.now() - 86400000) // 1 day ago
      const overdueTodo = makeTodo({
        title: "Test Todo",
        dueDate: pastDate,
      })
      const completedTodo = complete(overdueTodo)

      expect(isOverdue(completedTodo)).toBe(false)
    })

    test("should return false for todos without due date", () => {
      const todo = makeTodo({ title: "Test Todo" })

      expect(isOverdue(todo)).toBe(false)
    })
  })

  describe("equals", () => {
    test("should return true for todos with same ID", () => {
      const todo1 = makeTodo({ title: "Test Todo" })
      const todo2 = new Todo({ ...todo1, title: "Different Title" })

      expect(equals(todo1)(todo2)).toBe(true)
    })

    test("should return false for todos with different IDs", () => {
      const todo1 = makeTodo({ title: "Test Todo" })
      const todo2 = makeTodo({ title: "Test Todo" })

      expect(equals(todo1)(todo2)).toBe(false)
    })
  })

  describe("toJSON", () => {
    test("should convert todo to JSON format", () => {
      const dueDate = new Date("2024-12-31")
      const todo = makeTodo({
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
        status: "pending",
        priority: "high",
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        dueDate: dueDate.toISOString(),
      })
    })

    test("should handle optional fields in JSON format", () => {
      const todo = makeTodo({ title: "Test Todo" })
      const json = toJSON(todo)

      expect(json).toEqual({
        id: TodoId.toString(todo.id),
        title: "Test Todo",
        description: undefined,
        status: "pending",
        priority: DEFAULT_PRIORITY,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        dueDate: undefined,
      })
    })
  })
})