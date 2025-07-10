import { Effect, Layer, TestContext } from "effect"
import { beforeEach, describe, expect, test } from "bun:test"
import { removeTodos } from "../../src/operations/RemoveTodo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { makeTodo } from "../../src/domain/todo/Todo.js"
import { TodoId } from "../../src/domain/todo/TodoId.js"
import { makeMockTodoRepository } from "../infra/persistence/MockTodoRepository.js"

describe("RemoveTodo", () => {
  let mockRepository: ReturnType<typeof makeMockTodoRepository>
  let mockRepositoryLayer: Layer.Layer<TodoRepository>
  let testLayer: Layer.Layer<TodoRepository>

  beforeEach(() => {
    mockRepository = makeMockTodoRepository()
    mockRepositoryLayer = Layer.succeed(TodoRepository, mockRepository)
    testLayer = Layer.merge(mockRepositoryLayer, TestContext.TestContext)
  })

  describe("removeTodos", () => {
    test("should remove a single todo successfully", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Todo to remove" })
        mockRepository.setTodos([todo])

        const command = { ids: [todo.id] }

        yield* removeTodos(command)

        const remainingTodos = mockRepository.getTodos()
        expect(remainingTodos).toHaveLength(0)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should remove multiple todos successfully", async () => {
      const program = Effect.gen(function* () {
        const todo1 = yield* makeTodo({ title: "Todo 1" })
        const todo2 = yield* makeTodo({ title: "Todo 2" })
        const todo3 = yield* makeTodo({ title: "Todo 3" })
        
        mockRepository.setTodos([todo1, todo2, todo3])

        const command = { ids: [todo1.id, todo3.id] }

        yield* removeTodos(command)

        const remainingTodos = mockRepository.getTodos()
        expect(remainingTodos).toHaveLength(1)
        expect(remainingTodos[0].title).toBe("Todo 2")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should fail when no IDs are provided", async () => {
      const program = Effect.gen(function* () {
        const command = { ids: [] }
        return yield* removeTodos(command)
      })

      const result = Effect.runPromise(Effect.provide(program, testLayer) as any)
      await expect(result).rejects.toThrow("At least one ID must be provided")
    })

    test("should fail when todo does not exist", async () => {
      const program = Effect.gen(function* () {
        const existingTodo = yield* makeTodo({ title: "Existing Todo" })
        const nonExistentId = TodoId.generate()
        
        mockRepository.setTodos([existingTodo])

        const command = { ids: [nonExistentId] }
        return yield* removeTodos(command)
      })

      const result = Effect.runPromise(Effect.provide(program, testLayer) as any)
      await expect(result).rejects.toThrow("not found")
    })

    test("should fail when one of multiple todos does not exist", async () => {
      const program = Effect.gen(function* () {
        const existingTodo = yield* makeTodo({ title: "Existing Todo" })
        const nonExistentId = TodoId.generate()
        
        mockRepository.setTodos([existingTodo])

        const command = { ids: [existingTodo.id, nonExistentId] }
        return yield* removeTodos(command)
      })

      const result = Effect.runPromise(Effect.provide(program, testLayer) as any)
      await expect(result).rejects.toThrow("not found")
    })

    test("should remove all todos when all IDs are provided", async () => {
      const program = Effect.gen(function* () {
        const todo1 = yield* makeTodo({ title: "Todo 1" })
        const todo2 = yield* makeTodo({ title: "Todo 2" })
        const todo3 = yield* makeTodo({ title: "Todo 3" })
        
        mockRepository.setTodos([todo1, todo2, todo3])

        const command = { ids: [todo1.id, todo2.id, todo3.id] }

        yield* removeTodos(command)

        const remainingTodos = mockRepository.getTodos()
        expect(remainingTodos).toHaveLength(0)
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should handle removal of todos with different statuses", async () => {
      const program = Effect.gen(function* () {
        const pendingTodo = yield* makeTodo({ title: "Pending Todo" })
        const completedTodoBase = yield* makeTodo({ title: "Completed Todo" })
        const inProgressTodoBase = yield* makeTodo({ title: "In Progress Todo" })
        
        const completedTodo = { ...completedTodoBase, status: "completed" as const }
        const inProgressTodo = { ...inProgressTodoBase, status: "in_progress" as const }
        
        mockRepository.setTodos([pendingTodo, completedTodo, inProgressTodo])

        const command = { ids: [pendingTodo.id, completedTodo.id] }

        yield* removeTodos(command)

        const remainingTodos = mockRepository.getTodos()
        expect(remainingTodos).toHaveLength(1)
        expect(remainingTodos[0].title).toBe("In Progress Todo")
        expect(remainingTodos[0].status).toBe("in_progress")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should handle removal of todos with different priorities", async () => {
      const program = Effect.gen(function* () {
        const highPriorityTodo = yield* makeTodo({ title: "High Priority", priority: "high" })
        const mediumPriorityTodo = yield* makeTodo({ title: "Medium Priority", priority: "medium" })
        const lowPriorityTodo = yield* makeTodo({ title: "Low Priority", priority: "low" })
        
        mockRepository.setTodos([highPriorityTodo, mediumPriorityTodo, lowPriorityTodo])

        const command = { ids: [highPriorityTodo.id, lowPriorityTodo.id] }

        yield* removeTodos(command)

        const remainingTodos = mockRepository.getTodos()
        expect(remainingTodos).toHaveLength(1)
        expect(remainingTodos[0].title).toBe("Medium Priority")
        expect(remainingTodos[0].priority).toBe("medium")
      })

      await Effect.runPromise(Effect.provide(program, testLayer) as any)
    })

    test("should handle duplicate IDs gracefully", async () => {
      const program = Effect.gen(function* () {
        const todo = yield* makeTodo({ title: "Duplicate Test Todo" })
        mockRepository.setTodos([todo])

        const command = { ids: [todo.id, todo.id] }

        // This should not fail, but the second delete attempt should be handled gracefully
        // Since the first delete removes the todo, the second one should fail
        return yield* removeTodos(command)
      })

      const result = Effect.runPromise(Effect.provide(program, testLayer) as any)
      await expect(result).rejects.toThrow("not found")
    })
  })
})