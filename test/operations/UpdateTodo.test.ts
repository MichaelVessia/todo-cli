import { Effect, Layer } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { updateTodo } from "../../src/operations/UpdateTodo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { TodoValidationError, TodoNotFoundError } from "../../src/domain/todo/TodoErrors.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { TodoId } from "../../src/domain/todo/TodoId.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("UpdateTodo", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
  })

  describe("updateTodo", () => {
    test("should update todo title successfully", async () => {
      const originalTodo = makeTodo({ title: "Original Title" })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { title: "Updated Title" }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Updated Title")
      expect(result.id).toEqual(originalTodo.id)
      
      const updatedTodos = mockRepository.getTodos()
      expect(updatedTodos[0].title).toBe("Updated Title")
    })

    test("should update todo description successfully", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { description: "New description" }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.description).toBe("New description")
      expect(result.title).toBe("Test Todo") // Should preserve other fields
    })

    test("should update todo priority successfully", async () => {
      const originalTodo = makeTodo({ title: "Test Todo", priority: "low" })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { priority: "high" as const }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.priority).toBe("high")
      expect(result.title).toBe("Test Todo") // Should preserve other fields
    })

    test("should update todo status successfully", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { status: "completed" as const }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.status).toBe("completed")
      expect(result.title).toBe("Test Todo") // Should preserve other fields
    })

    test("should update todo due date successfully", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const newDueDate = new Date("2024-12-31")
      const command = {
        id: originalTodo.id,
        changes: { dueDate: newDueDate }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.dueDate).toEqual(newDueDate)
      expect(result.title).toBe("Test Todo") // Should preserve other fields
    })

    test("should update multiple fields successfully", async () => {
      const originalTodo = makeTodo({ 
        title: "Original Title",
        priority: "low",
        description: "Original description"
      })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { 
          title: "Updated Title",
          priority: "high" as const,
          status: "in_progress" as const,
          description: "Updated description"
        }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Updated Title")
      expect(result.priority).toBe("high")
      expect(result.status).toBe("in_progress")
      expect(result.description).toBe("Updated description")
      expect(result.id).toEqual(originalTodo.id)
    })

    test("should fail when todo does not exist", async () => {
      const nonExistentId = TodoId.generate()

      const command = {
        id: nonExistentId,
        changes: { title: "New Title" }
      }

      const result = Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("not found")
    })

    test("should handle empty changes object", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: {}
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Test Todo")
      expect(result.id).toEqual(originalTodo.id)
      expect(result.status).toBe(originalTodo.status)
      expect(result.priority).toBe(originalTodo.priority)
    })

    test("should preserve unchanged fields", async () => {
      const originalTodo = makeTodo({ 
        title: "Original Title",
        description: "Original description",
        priority: "medium",
        dueDate: new Date("2024-06-15")
      })
      mockRepository.setTodos([originalTodo])

      const command = {
        id: originalTodo.id,
        changes: { title: "Updated Title" }
      }

      const result = await Effect.runPromise(
        updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result.title).toBe("Updated Title")
      expect(result.description).toBe("Original description")
      expect(result.priority).toBe("medium")
      expect(result.dueDate).toEqual(new Date("2024-06-15"))
      expect(result.status).toBe(originalTodo.status)
      expect(result.createdAt).toEqual(originalTodo.createdAt)
    })

    test("should handle all status values", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const statuses = ["pending", "in_progress", "completed"] as const

      for (const status of statuses) {
        const command = {
          id: originalTodo.id,
          changes: { status }
        }

        const result = await Effect.runPromise(
          updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
        )

        expect(result.status).toBe(status)
      }
    })

    test("should handle all priority values", async () => {
      const originalTodo = makeTodo({ title: "Test Todo" })
      mockRepository.setTodos([originalTodo])

      const priorities = ["low", "medium", "high"] as const

      for (const priority of priorities) {
        const command = {
          id: originalTodo.id,
          changes: { priority }
        }

        const result = await Effect.runPromise(
          updateTodo(command).pipe(Effect.provide(mockRepositoryLayer))
        )

        expect(result.priority).toBe(priority)
      }
    })
  })
})