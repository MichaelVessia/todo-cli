import { Effect, Layer } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { getTodos } from "../../src/operations/ListTodos.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("ListTodos", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
  })

  describe("getTodos", () => {
    test("should return empty array when no todos exist", async () => {
      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toEqual([])
    })

    test("should return all todos", async () => {
      const todo1 = makeTodo({ title: "Todo 1", priority: "high" })
      const todo2 = makeTodo({ title: "Todo 2", priority: "low" })
      const todo3 = makeTodo({ title: "Todo 3", priority: "medium" })

      mockRepository.setTodos([todo1, todo2, todo3])

      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toHaveLength(3)
      expect(result[0].title).toBe("Todo 1")
      expect(result[1].title).toBe("Todo 2")
      expect(result[2].title).toBe("Todo 3")
    })

    test("should return todos with different statuses", async () => {
      const pendingTodo = makeTodo({ title: "Pending Todo" })
      const completedTodo = { ...makeTodo({ title: "Completed Todo" }), status: "completed" as const }
      const inProgressTodo = { ...makeTodo({ title: "In Progress Todo" }), status: "in_progress" as const }

      mockRepository.setTodos([pendingTodo, completedTodo, inProgressTodo])

      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toHaveLength(3)

      const statuses = result.map(todo => todo.status)
      expect(statuses).toContain("pending")
      expect(statuses).toContain("completed")
      expect(statuses).toContain("in_progress")
    })

    test("should return todos with different priorities", async () => {
      const highPriorityTodo = makeTodo({ title: "High Priority", priority: "high" })
      const mediumPriorityTodo = makeTodo({ title: "Medium Priority", priority: "medium" })
      const lowPriorityTodo = makeTodo({ title: "Low Priority", priority: "low" })

      mockRepository.setTodos([highPriorityTodo, mediumPriorityTodo, lowPriorityTodo])

      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toHaveLength(3)

      const priorities = result.map(todo => todo.priority)
      expect(priorities).toContain("high")
      expect(priorities).toContain("medium")
      expect(priorities).toContain("low")
    })

    test("should return todos with optional fields", async () => {
      const todoWithDescription = makeTodo({
        title: "Todo with description",
        description: "This todo has a description",
        priority: "medium"
      })

      const todoWithDueDate = makeTodo({
        title: "Todo with due date",
        dueDate: new Date("2024-12-31"),
        priority: "high"
      })

      const todoWithBoth = makeTodo({
        title: "Todo with both",
        description: "Has both description and due date",
        dueDate: new Date("2024-06-15"),
        priority: "low"
      })

      mockRepository.setTodos([todoWithDescription, todoWithDueDate, todoWithBoth])

      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toHaveLength(3)

      const todoWithDescriptionResult = result.find(t => t.title === "Todo with description")
      expect(todoWithDescriptionResult?.description).toBe("This todo has a description")

      const todoWithDueDateResult = result.find(t => t.title === "Todo with due date")
      expect(todoWithDueDateResult?.dueDate).toEqual(new Date("2024-12-31"))

      const todoWithBothResult = result.find(t => t.title === "Todo with both")
      expect(todoWithBothResult?.description).toBe("Has both description and due date")
      expect(todoWithBothResult?.dueDate).toEqual(new Date("2024-06-15"))
    })

    test("should preserve todo properties", async () => {
      const originalTodo = makeTodo({
        title: "Original Todo",
        description: "Original description",
        priority: "high",
        dueDate: new Date("2024-12-31")
      })

      mockRepository.setTodos([originalTodo])

      const result = await Effect.runPromise(
        getTodos().pipe(Effect.provide(mockRepositoryLayer))
      )

      expect(result).toHaveLength(1)
      const retrievedTodo = result[0]

      expect(retrievedTodo.id).toEqual(originalTodo.id)
      expect(retrievedTodo.title).toBe(originalTodo.title)
      expect(retrievedTodo.description).toBe(originalTodo.description)
      expect(retrievedTodo.status).toBe(originalTodo.status)
      expect(retrievedTodo.priority).toBe(originalTodo.priority)
      expect(retrievedTodo.createdAt).toEqual(originalTodo.createdAt)
      expect(retrievedTodo.updatedAt).toEqual(originalTodo.updatedAt)
      expect(retrievedTodo.dueDate).toEqual(originalTodo.dueDate)
    })
  })
})
