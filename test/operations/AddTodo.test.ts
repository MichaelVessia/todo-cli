import { Effect, Layer } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { addTodo } from "../../src/operations/AddTodo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("AddTodo", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
  })

  describe("addTodo", () => {
    test("should add a new todo successfully", async () => {
      const command = {
        title: "Test Todo",
        description: "Test description",
        priority: "medium" as const,
        dueDate: new Date("2024-12-31"),
      }

      const result = await Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Test Todo")
      expect(result.description).toBe("Test description")
      expect(result.priority).toBe("medium")
      expect(result.dueDate).toEqual(new Date("2024-12-31"))
      expect(result.status).toBe("unstarted")

      const savedTodos = mockRepository.getTodos()
      expect(savedTodos).toHaveLength(1)
      expect(savedTodos[0].title).toBe("Test Todo")
    })

    test("should fail when title is empty", async () => {
      const command = {
        title: "",
        description: "Test description",
        priority: "medium" as const,
        dueDate: new Date("2024-12-31"),
      }

      const result = Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("Title cannot be empty")
    })

    test("should fail when title is only whitespace", async () => {
      const command = {
        title: "   \n\t  ",
        description: "Test description",
        priority: "medium" as const,
        dueDate: new Date("2024-12-31"),
      }

      const result = Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("Title cannot be empty")
    })

    test("should add todo with minimal required fields", async () => {
      const command = {
        title: "Minimal Todo",
        description: "",
        priority: "low" as const,
        dueDate: new Date(),
      }

      const result = await Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Minimal Todo")
      expect(result.priority).toBe("low")
      expect(result.status).toBe("unstarted")
    })

    test("should handle high priority todos", async () => {
      const command = {
        title: "High Priority Todo",
        description: "Important task",
        priority: "high" as const,
        dueDate: new Date("2024-01-01"),
      }

      const result = await Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.priority).toBe("high")
      expect(result.title).toBe("High Priority Todo")
    })

    test("should create todo with current timestamps", async () => {
      const beforeTime = new Date()
      
      const command = {
        title: "Time Test Todo",
        description: "Test timestamps",
        priority: "medium" as const,
        dueDate: new Date("2024-12-31"),
      }

      const result = await Effect.runPromise(
        addTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const afterTime = new Date()

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    test("should generate unique IDs for different todos", async () => {
      const command1 = {
        title: "Todo 1",
        description: "First todo",
        priority: "medium" as const,
        dueDate: new Date("2024-12-31"),
      }

      const command2 = {
        title: "Todo 2",
        description: "Second todo",
        priority: "high" as const,
        dueDate: new Date("2024-12-31"),
      }

      const result1 = await Effect.runPromise(
        addTodo(command1).pipe(Effect.provide(mockRepositoryLayer))
      )

      const result2 = await Effect.runPromise(
        addTodo(command2).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result1.id).not.toEqual(result2.id)

      const savedTodos = mockRepository.getTodos()
      expect(savedTodos).toHaveLength(2)
    })
  })
})