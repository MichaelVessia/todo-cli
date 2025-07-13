import { Layer, Effect, TestContext, TestClock } from "effect"
import { describe, expect, test } from "bun:test"
import { generateReport, generateFilteredReport, type ReportFilters, type TodoStatistics } from "../../src/operations/GenerateReport.js"
import { makeTodo, complete } from "../../src/domain/todo/Todo.js"
import { TodoRepository } from "../../src/domain/todo/TodoRepository.js"
import { SqliteTest } from "../../src/infra/persistence/SqliteTodoRepository.js"

const testLayer = Layer.merge(SqliteTest, TestContext.TestContext)

describe("GenerateReport", () => {
  test("should generate report with empty todos", async () => {
    const stats = await Effect.runPromise(
      generateReport().pipe(Effect.provide(testLayer)) as any
    ) as TodoStatistics

    expect(stats.total).toBe(0)
    expect(stats.completionRate).toBe(0)
    expect(stats.byStatus.unstarted).toBe(0)
    expect(stats.byStatus.inProgress).toBe(0)
    expect(stats.byStatus.completed).toBe(0)
    expect(stats.byPriority.high).toBe(0)
    expect(stats.byPriority.medium).toBe(0)
    expect(stats.byPriority.low).toBe(0)
    expect(stats.overdue).toBe(0)
    expect(stats.dueThisWeek).toBe(0)
  })

  test("should generate report with multiple todos", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository

      // Create test todos
      const todo1 = yield* makeTodo({ title: "Todo 1", priority: "high" })
      const todo2 = yield* makeTodo({ title: "Todo 2", priority: "medium" })
      const todo3 = yield* makeTodo({ title: "Todo 3", priority: "low" })
      
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      yield* repository.save(todo3)

      // Complete one todo
      const completedTodo = yield* complete(todo1)
      yield* repository.update(completedTodo)

      return yield* generateReport()
    })

    const stats = await Effect.runPromise(program.pipe(Effect.provide(testLayer)) as any) as TodoStatistics

    expect(stats.total).toBe(3)
    expect(stats.completionRate).toBe(33) // 1/3 * 100 rounded
    expect(stats.byStatus.unstarted).toBe(2)
    expect(stats.byStatus.inProgress).toBe(0)
    expect(stats.byStatus.completed).toBe(1)
    expect(stats.byPriority.high).toBe(1)
    expect(stats.byPriority.medium).toBe(1)
    expect(stats.byPriority.low).toBe(1)
  })

  test("should filter report by status", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository

      // Create test todos
      const todo1 = yield* makeTodo({ title: "Todo 1" })
      const todo2 = yield* makeTodo({ title: "Todo 2" })
      const todo3 = yield* makeTodo({ title: "Todo 3" })
      
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      yield* repository.save(todo3)

      // Complete one todo
      const completedTodo = yield* complete(todo1)
      yield* repository.update(completedTodo)

      const filters: ReportFilters = { status: "unstarted" }
      return yield* generateFilteredReport(filters)
    })

    const stats = await Effect.runPromise(program.pipe(Effect.provide(testLayer)) as any) as TodoStatistics

    expect(stats.total).toBe(2)
    expect(stats.byStatus.unstarted).toBe(2)
    expect(stats.byStatus.completed).toBe(0)
  })

  test("should filter report by priority", async () => {
    const program = Effect.gen(function* () {
      const repository = yield* TodoRepository

      // Create test todos
      const todo1 = yield* makeTodo({ title: "Todo 1", priority: "high" })
      const todo2 = yield* makeTodo({ title: "Todo 2", priority: "medium" })
      const todo3 = yield* makeTodo({ title: "Todo 3", priority: "high" })
      
      yield* repository.save(todo1)
      yield* repository.save(todo2)
      yield* repository.save(todo3)

      const filters: ReportFilters = { priority: "high" }
      return yield* generateFilteredReport(filters)
    })

    const stats = await Effect.runPromise(program.pipe(Effect.provide(testLayer)) as any) as TodoStatistics

    expect(stats.total).toBe(2)
    expect(stats.byPriority.high).toBe(2)
    expect(stats.byPriority.medium).toBe(0)
    expect(stats.byPriority.low).toBe(0)
  })

  test("should detect overdue todos", async () => {
    const program = Effect.gen(function* () {
      // Set a fixed time for deterministic testing
      const fixedTime = 1000000000 // Fixed timestamp
      yield* TestClock.setTime(fixedTime)
      
      const repository = yield* TodoRepository

      // Create overdue todo (due yesterday)
      const yesterday = fixedTime - (24 * 60 * 60 * 1000)
      const overdueTodo = yield* makeTodo({ 
        title: "Overdue Todo", 
        dueDate: yesterday 
      })
      
      // Create future due todo
      const tomorrow = fixedTime + (24 * 60 * 60 * 1000)
      const futureTodo = yield* makeTodo({ 
        title: "Future Todo", 
        dueDate: tomorrow 
      })
      
      yield* repository.save(overdueTodo)
      yield* repository.save(futureTodo)

      return yield* generateReport()
    })

    const stats = await Effect.runPromise(program.pipe(Effect.provide(testLayer)) as any) as TodoStatistics

    expect(stats.total).toBe(2)
    expect(stats.overdue).toBe(1)
  })

  test("should count todos due this week", async () => {
    const program = Effect.gen(function* () {
      // Set a fixed time for deterministic testing
      const fixedTime = 1000000000 // Fixed timestamp
      yield* TestClock.setTime(fixedTime)
      
      const repository = yield* TodoRepository

      // Create todo due in 3 days
      const inThreeDays = fixedTime + (3 * 24 * 60 * 60 * 1000)
      const dueThisWeekTodo = yield* makeTodo({ 
        title: "Due This Week", 
        dueDate: inThreeDays 
      })
      
      // Create todo due in 10 days (not this week)
      const inTenDays = fixedTime + (10 * 24 * 60 * 60 * 1000)
      const dueNextWeekTodo = yield* makeTodo({ 
        title: "Due Next Week", 
        dueDate: inTenDays 
      })
      
      yield* repository.save(dueThisWeekTodo)
      yield* repository.save(dueNextWeekTodo)

      return yield* generateReport()
    })

    const stats = await Effect.runPromise(program.pipe(Effect.provide(testLayer)) as any) as TodoStatistics

    expect(stats.total).toBe(2)
    expect(stats.dueThisWeek).toBe(1)
  })

  test("should count created this week/month", async () => {
    const stats = await Effect.runPromise(
      Effect.gen(function* () {
        const repository = yield* TodoRepository

        // Create a todo (will be created "now")
        const todo = yield* makeTodo({ title: "Recent Todo" })
        yield* repository.save(todo)

        return yield* generateReport()
      }).pipe(Effect.provide(testLayer)) as any
    ) as TodoStatistics

    expect(stats.total).toBe(1)
    expect(stats.createdThisWeek).toBe(1)
    expect(stats.createdThisMonth).toBe(1)
  })
})