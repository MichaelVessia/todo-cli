import { Effect, Layer } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { removeTodos } from "../../src/operations/RemoveTodo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { TodoId } from "../../src/domain/todo/TodoId.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("RemoveTodo", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
  })

  describe("removeTodos", () => {
    test("should remove a single todo successfully", async () => {
      const todo = makeTodo({ title: "Todo to remove" })
      mockRepository.setTodos([todo])

      const command = { ids: [todo.id] }

      await Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const remainingTodos = mockRepository.getTodos()
      expect(remainingTodos).toHaveLength(0)
    })

    test("should remove multiple todos successfully", async () => {
      const todo1 = makeTodo({ title: "Todo 1" })
      const todo2 = makeTodo({ title: "Todo 2" })
      const todo3 = makeTodo({ title: "Todo 3" })
      
      mockRepository.setTodos([todo1, todo2, todo3])

      const command = { ids: [todo1.id, todo3.id] }

      await Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const remainingTodos = mockRepository.getTodos()
      expect(remainingTodos).toHaveLength(1)
      expect(remainingTodos[0].title).toBe("Todo 2")
    })

    test("should fail when no IDs are provided", async () => {
      const command = { ids: [] }

      const result = Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("At least one ID must be provided")
    })

    test("should fail when todo does not exist", async () => {
      const existingTodo = makeTodo({ title: "Existing Todo" })
      const nonExistentId = TodoId.generate()
      
      mockRepository.setTodos([existingTodo])

      const command = { ids: [nonExistentId] }

      const result = Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("not found")
    })

    test("should fail when one of multiple todos does not exist", async () => {
      const existingTodo = makeTodo({ title: "Existing Todo" })
      const nonExistentId = TodoId.generate()
      
      mockRepository.setTodos([existingTodo])

      const command = { ids: [existingTodo.id, nonExistentId] }

      const result = Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("not found")
    })

    test("should remove all todos when all IDs are provided", async () => {
      const todo1 = makeTodo({ title: "Todo 1" })
      const todo2 = makeTodo({ title: "Todo 2" })
      const todo3 = makeTodo({ title: "Todo 3" })
      
      mockRepository.setTodos([todo1, todo2, todo3])

      const command = { ids: [todo1.id, todo2.id, todo3.id] }

      await Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const remainingTodos = mockRepository.getTodos()
      expect(remainingTodos).toHaveLength(0)
    })

    test("should handle removal of todos with different statuses", async () => {
      const pendingTodo = makeTodo({ title: "Pending Todo" })
      const completedTodo = { ...makeTodo({ title: "Completed Todo" }), status: "completed" as const }
      const inProgressTodo = { ...makeTodo({ title: "In Progress Todo" }), status: "in_progress" as const }
      
      mockRepository.setTodos([pendingTodo, completedTodo, inProgressTodo])

      const command = { ids: [pendingTodo.id, completedTodo.id] }

      await Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const remainingTodos = mockRepository.getTodos()
      expect(remainingTodos).toHaveLength(1)
      expect(remainingTodos[0].title).toBe("In Progress Todo")
      expect(remainingTodos[0].status).toBe("in_progress")
    })

    test("should handle removal of todos with different priorities", async () => {
      const highPriorityTodo = makeTodo({ title: "High Priority", priority: "high" })
      const mediumPriorityTodo = makeTodo({ title: "Medium Priority", priority: "medium" })
      const lowPriorityTodo = makeTodo({ title: "Low Priority", priority: "low" })
      
      mockRepository.setTodos([highPriorityTodo, mediumPriorityTodo, lowPriorityTodo])

      const command = { ids: [highPriorityTodo.id, lowPriorityTodo.id] }

      await Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      const remainingTodos = mockRepository.getTodos()
      expect(remainingTodos).toHaveLength(1)
      expect(remainingTodos[0].title).toBe("Medium Priority")
      expect(remainingTodos[0].priority).toBe("medium")
    })

    test("should handle duplicate IDs gracefully", async () => {
      const todo = makeTodo({ title: "Duplicate Test Todo" })
      mockRepository.setTodos([todo])

      const command = { ids: [todo.id, todo.id] }

      // This should not fail, but the second delete attempt should be handled gracefully
      // Since the first delete removes the todo, the second one should fail
      const result = Effect.runPromise(
        removeTodos(command).pipe(Effect.provide(mockRepositoryLayer))
      )

      await expect(result).rejects.toThrow("not found")
    })
  })
})