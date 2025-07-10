import { Effect, Layer, TestContext } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { getTodos } from "../../src/operations/ListTodos.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("ListTodos", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>
  let testLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
    testLayer = Layer.merge(mockRepositoryLayer, TestContext.TestContext)
  })

  describe("getTodos", () => {
    test("should return empty array when no todos exist", async () => {
      const result = await Effect.runPromise(
        Effect.provide(getTodos(), testLayer) as any
      )

      expect(result).toEqual([])
    })

    test("should return all todos", async () => {
      const program = Effect.gen(function* () {
        const todo1 = yield* makeTodo({ title: "Todo 1", priority: "high" })
        const todo2 = yield* makeTodo({ title: "Todo 2", priority: "low" })
        const todo3 = yield* makeTodo({ title: "Todo 3", priority: "medium" })

        mockRepository.setTodos([todo1, todo2, todo3])

        const result = yield* getTodos()

        expect(result).toHaveLength(3)
        expect(result[0].title).toBe("Todo 1")
        expect(result[1].title).toBe("Todo 2")
        expect(result[2].title).toBe("Todo 3")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should return todos with different statuses", async () => {
      const program = Effect.gen(function* () {
        const unstartedTodo = yield* makeTodo({ title: "Unstarted Todo" })
        const completedTodoBase = yield* makeTodo({ title: "Completed Todo" })
        const inProgressTodoBase = yield* makeTodo({ title: "In Progress Todo" })
        
        const completedTodo = { ...completedTodoBase, status: "completed" as const }
        const inProgressTodo = { ...inProgressTodoBase, status: "in_progress" as const }

        mockRepository.setTodos([unstartedTodo, completedTodo, inProgressTodo])

        const result = yield* getTodos()

        expect(result).toHaveLength(3)

        const statuses = result.map(todo => todo.status)
        expect(statuses).toContain("unstarted")
        expect(statuses).toContain("completed")
        expect(statuses).toContain("in_progress")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should return todos with different priorities", async () => {
      const program = Effect.gen(function* () {
        const highPriorityTodo = yield* makeTodo({ title: "High Priority", priority: "high" })
        const mediumPriorityTodo = yield* makeTodo({ title: "Medium Priority", priority: "medium" })
        const lowPriorityTodo = yield* makeTodo({ title: "Low Priority", priority: "low" })

        mockRepository.setTodos([highPriorityTodo, mediumPriorityTodo, lowPriorityTodo])

        const result = yield* getTodos()

        expect(result).toHaveLength(3)

        const priorities = result.map(todo => todo.priority)
        expect(priorities).toContain("high")
        expect(priorities).toContain("medium")
        expect(priorities).toContain("low")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should return todos with optional fields", async () => {
      const program = Effect.gen(function* () {
        const todoWithDescription = yield* makeTodo({
          title: "Todo with description",
          description: "This todo has a description",
          priority: "medium"
        })

        const todoWithDueDate = yield* makeTodo({
          title: "Todo with due date",
          dueDate: new Date("2024-12-31").getTime(),
          priority: "high"
        })

        const todoWithBoth = yield* makeTodo({
          title: "Todo with both",
          description: "Has both description and due date",
          dueDate: new Date("2024-06-15").getTime(),
          priority: "low"
        })

        mockRepository.setTodos([todoWithDescription, todoWithDueDate, todoWithBoth])

        const result = yield* getTodos()

        expect(result).toHaveLength(3)

        const todoWithDescriptionResult = result.find(t => t.title === "Todo with description")!
        expect(todoWithDescriptionResult.description).toBe("This todo has a description")

        const todoWithDueDateResult = result.find(t => t.title === "Todo with due date")!
        expect(todoWithDueDateResult.dueDate).toBe(new Date("2024-12-31").getTime())

        const todoWithBothResult = result.find(t => t.title === "Todo with both")!
        expect(todoWithBothResult.description).toBe("Has both description and due date")
        expect(todoWithBothResult.dueDate).toBe(new Date("2024-06-15").getTime())
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should preserve todo properties", async () => {
      const program = Effect.gen(function* () {
        const originalTodo = yield* makeTodo({
          title: "Original Todo",
          description: "Original description",
          priority: "high",
          dueDate: new Date("2024-12-31").getTime()
        })

        mockRepository.setTodos([originalTodo])

        const result = yield* getTodos()

        expect(result).toHaveLength(1)
        const retrievedTodo = result[0]

        expect(retrievedTodo.id).toEqual(originalTodo.id)
        expect(retrievedTodo.title).toBe(originalTodo.title)
        expect(retrievedTodo.description).toBe(originalTodo.description!)
        expect(retrievedTodo.status).toBe(originalTodo.status)
        expect(retrievedTodo.priority).toBe(originalTodo.priority)
        expect(retrievedTodo.createdAt).toBe(originalTodo.createdAt)
        expect(retrievedTodo.updatedAt).toBe(originalTodo.updatedAt)
        expect(retrievedTodo.dueDate).toBe(originalTodo.dueDate!)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })
  })
})