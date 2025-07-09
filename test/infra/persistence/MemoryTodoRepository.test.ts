import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { makeTodo } from "../../../src/domain/todo/Todo.js"
import { TodoAlreadyExistsError, TodoNotFoundError } from "../../../src/domain/todo/TodoErrors.js"
import { TodoId } from "../../../src/domain/todo/TodoId.js"
import { MemoryTodoRepository } from "../../../src/infra/persistence/MemoryTodoRepository.js"

describe("MemoryTodoRepository", () => {
  test("should start with empty repository", async () => {
    const repository = new MemoryTodoRepository()
    const todos = await Effect.runPromise(repository.findAll())
    
    expect(todos).toEqual([])
  })

  test("should save a new todo", async () => {
    const repository = new MemoryTodoRepository()
    const todo = makeTodo({
      title: "Test todo",
      description: "Test description",
      priority: "high"
    })

    const savedTodo = await Effect.runPromise(repository.save(todo))
    
    expect(savedTodo).toEqual(todo)
    
    const todos = await Effect.runPromise(repository.findAll())
    expect(todos).toHaveLength(1)
    expect(todos[0]).toEqual(todo)
  })

  test("should not save duplicate todo", async () => {
    const repository = new MemoryTodoRepository()
    const todo = makeTodo({ title: "Test todo" })

    await Effect.runPromise(repository.save(todo))
    
    const result = await Effect.runPromiseExit(repository.save(todo))
    
    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") {
      expect(result.cause._tag).toBe("Fail")
      if (result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(TodoAlreadyExistsError)
      }
    }
  })

  test("should find todo by id", async () => {
    const repository = new MemoryTodoRepository()
    const todo = makeTodo({ title: "Test todo" })

    await Effect.runPromise(repository.save(todo))
    const foundTodo = await Effect.runPromise(repository.findById(todo.id))
    
    expect(foundTodo).toEqual(todo)
  })

  test("should return TodoNotFoundError for non-existent id", async () => {
    const repository = new MemoryTodoRepository()
    const id = TodoId.generate()

    const result = await Effect.runPromiseExit(repository.findById(id))
    
    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") {
      expect(result.cause._tag).toBe("Fail")
      if (result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(TodoNotFoundError)
      }
    }
  })

  test("should update existing todo", async () => {
    const repository = new MemoryTodoRepository()
    const todo = makeTodo({ title: "Original title" })

    await Effect.runPromise(repository.save(todo))
    
    const updatedTodo = { ...todo, title: "Updated title" }
    const result = await Effect.runPromise(repository.update(updatedTodo))
    
    expect(result.title).toBe("Updated title")
    
    const foundTodo = await Effect.runPromise(repository.findById(todo.id))
    expect(foundTodo.title).toBe("Updated title")
  })

  test("should delete todo by id", async () => {
    const repository = new MemoryTodoRepository()
    const todo = makeTodo({ title: "Test todo" })

    await Effect.runPromise(repository.save(todo))
    await Effect.runPromise(repository.deleteById(todo.id))
    
    const todos = await Effect.runPromise(repository.findAll())
    expect(todos).toHaveLength(0)
  })

  test("should return TodoNotFoundError when deleting non-existent todo", async () => {
    const repository = new MemoryTodoRepository()
    const id = TodoId.generate()

    const result = await Effect.runPromiseExit(repository.deleteById(id))
    
    expect(result._tag).toBe("Failure")
    if (result._tag === "Failure") {
      expect(result.cause._tag).toBe("Fail")
      if (result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(TodoNotFoundError)
      }
    }
  })

  test("should find todos by status", async () => {
    const repository = new MemoryTodoRepository()
    const todo1 = makeTodo({ title: "Todo 1" })
    const todo2 = makeTodo({ title: "Todo 2" })
    const todo3 = { ...makeTodo({ title: "Todo 3" }), status: "completed" as const }

    await Effect.runPromise(repository.save(todo1))
    await Effect.runPromise(repository.save(todo2))
    await Effect.runPromise(repository.save(todo3))
    
    const pendingTodos = await Effect.runPromise(repository.findByStatus("pending"))
    const completedTodos = await Effect.runPromise(repository.findByStatus("completed"))
    
    expect(pendingTodos).toHaveLength(2)
    expect(completedTodos).toHaveLength(1)
    expect(completedTodos[0].title).toBe("Todo 3")
  })

  test("should find todos by priority", async () => {
    const repository = new MemoryTodoRepository()
    const todo1 = makeTodo({ title: "Todo 1", priority: "low" })
    const todo2 = makeTodo({ title: "Todo 2", priority: "high" })
    const todo3 = makeTodo({ title: "Todo 3", priority: "high" })

    await Effect.runPromise(repository.save(todo1))
    await Effect.runPromise(repository.save(todo2))
    await Effect.runPromise(repository.save(todo3))
    
    const lowPriorityTodos = await Effect.runPromise(repository.findByPriority("low"))
    const highPriorityTodos = await Effect.runPromise(repository.findByPriority("high"))
    
    expect(lowPriorityTodos).toHaveLength(1)
    expect(highPriorityTodos).toHaveLength(2)
  })

  test("should count todos correctly", async () => {
    const repository = new MemoryTodoRepository()
    
    expect(await Effect.runPromise(repository.count())).toBe(0)
    
    await Effect.runPromise(repository.save(makeTodo({ title: "Todo 1" })))
    expect(await Effect.runPromise(repository.count())).toBe(1)
    
    await Effect.runPromise(repository.save(makeTodo({ title: "Todo 2" })))
    expect(await Effect.runPromise(repository.count())).toBe(2)
  })
})