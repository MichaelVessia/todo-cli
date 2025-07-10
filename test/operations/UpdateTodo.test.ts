import { Effect, Layer, TestContext } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { updateTodo } from "../../src/operations/UpdateTodo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { TodoId } from "../../src/domain/todo/TodoId.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("UpdateTodo", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>
  let testLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
    testLayer = Layer.merge(mockRepositoryLayer, TestContext.TestContext)
  })

  describe("updateTodo", () => {
    test("should update todo title successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Original Title" })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: { title: "Updated Title" }
        }

        const result = yield* updateTodo(command)

        expect(result.title).toBe("Updated Title")
        expect(result.id).toEqual(originalTodo.id)
        
        const updatedTodos = mockRepository.getTodos()
        expect(updatedTodos[0].title).toBe("Updated Title")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should update todo description successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: { description: "New description" }
        }

        const result = yield* updateTodo(command)

        expect(result.description).toBe("New description")
        expect(result.title).toBe("Test Todo") // Should preserve other fields
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should update todo priority successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo", priority: "low" })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: { priority: "high" as const }
        }

        const result = yield* updateTodo(command)

        expect(result.priority).toBe("high")
        expect(result.title).toBe("Test Todo") // Should preserve other fields
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should update todo status successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: { status: "completed" as const }
        }

        const result = yield* updateTodo(command)

        expect(result.status).toBe("completed")
        expect(result.title).toBe("Test Todo") // Should preserve other fields
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should update todo due date successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const newDueDate = new Date("2024-12-31").getTime()
        const command = {
          id: originalTodo.id,
          changes: { dueDate: newDueDate }
        }

        const result = yield* updateTodo(command)

        expect(result.dueDate).toBe(newDueDate)
        expect(result.title).toBe("Test Todo") // Should preserve other fields
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should update multiple fields successfully", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ 
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

        const result = yield* updateTodo(command)

        expect(result.title).toBe("Updated Title")
        expect(result.priority).toBe("high")
        expect(result.status).toBe("in_progress")
        expect(result.description).toBe("Updated description")
        expect(result.id).toEqual(originalTodo.id)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should fail when todo does not exist", async () => {
      const program = Effect.gen(function* () {
        const nonExistentId = TodoId.generate()

        const command = {
          id: nonExistentId,
          changes: { title: "New Title" }
        }

        return yield* updateTodo(command)
      })

      const result = Effect.runPromise(Effect.provide(program, testLayer) as any)
      await expect(result).rejects.toThrow("not found")
    })

    test("should handle empty changes object", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: {}
        }

        const result = yield* updateTodo(command)

        expect(result.title).toBe("Test Todo")
        expect(result.id).toEqual(originalTodo.id)
        expect(result.status).toBe(originalTodo.status)
        expect(result.priority).toBe(originalTodo.priority)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should preserve unchanged fields", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ 
          title: "Original Title",
          description: "Original description",
          priority: "medium",
          dueDate: new Date("2024-06-15").getTime()
        })
        mockRepository.setTodos([originalTodo])

        const command = {
          id: originalTodo.id,
          changes: { title: "Updated Title" }
        }

        const result = yield* updateTodo(command)

        expect(result.title).toBe("Updated Title")
        expect(result.description).toBe("Original description")
        expect(result.priority).toBe("medium")
        expect(result.dueDate).toBe(new Date("2024-06-15").getTime())
        expect(result.status).toBe(originalTodo.status)
        expect(result.createdAt).toBe(originalTodo.createdAt)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should handle all status values", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const statuses = ["unstarted", "in_progress", "completed"] as const

        for (const status of statuses) {
          const command = {
            id: originalTodo.id,
            changes: { status }
          }

          const result = yield* updateTodo(command)
          expect(result.status).toBe(status)
        }
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should handle all priority values", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({ title: "Test Todo" })
        mockRepository.setTodos([originalTodo])

        const priorities = ["low", "medium", "high"] as const

        for (const priority of priorities) {
          const command = {
            id: originalTodo.id,
            changes: { priority }
          }

          const result = yield* updateTodo(command)
          expect(result.priority).toBe(priority)
        }
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })
  })
})