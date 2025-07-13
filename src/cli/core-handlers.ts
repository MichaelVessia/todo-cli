import { Console, Effect } from "effect"
import type { PRIORITY_ARRAY } from "../domain/todo/PriorityConstants.js"
import type { TodoStatus } from "../domain/todo/Todo.js"
import { TodoId } from "../domain/todo/TodoId.js"
import { type AddTodoCommand, addTodo } from "../operations/AddTodo.js"
import { generateFilteredReport, generateReport, type ReportFilters } from "../operations/GenerateReport.js"
import { getTodos } from "../operations/ListTodos.js"
import { removeTodos } from "../operations/RemoveTodo.js"
import type { UpdateTodoCommand } from "../operations/UpdateTodo.js"
import { updateTodo } from "../operations/UpdateTodo.js"

export interface AddTodoArgs {
  title: string
  description: string
  priority: (typeof PRIORITY_ARRAY)[number]
  dueDate?: string | undefined
}

export interface UpdateTodoArgs {
  id: string
  title?: string
  description?: string
  priority?: (typeof PRIORITY_ARRAY)[number]
  status?: TodoStatus
  dueDate?: string
}

export interface RemoveTodoArgs {
  ids: string[]
}

export interface CompleteTodoArgs {
  ids: string[]
}

export const addTodoWithArgs = (args: AddTodoArgs) =>
  Effect.gen(function* () {
    let dueDate: number | undefined
    if (args.dueDate && args.dueDate.trim() !== "") {
      const parsedDate = new Date(args.dueDate)
      if (Number.isNaN(parsedDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
      dueDate = parsedDate.getTime()
    }

    const command: AddTodoCommand = {
      title: args.title,
      description: args.description,
      priority: args.priority,
      ...(dueDate ? { dueDate } : {})
    }

    const result = yield* addTodo(command)
    yield* Console.log(`Todo added: ${result.title}`)
    return result
  })

export const listTodosWithArgs = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()
    if (todos.length === 0) {
      yield* Console.log("No todos found!")
      return []
    }

    // Sort todos: "unstarted" and "in_progress" first, then "completed"
    const sortedTodos = [...todos].sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1
      if (a.status !== "completed" && b.status === "completed") return -1
      return 0
    })

    yield* Effect.forEach(sortedTodos, (todo) => {
      const priorityEmoji = todo.priority === "high" ? "🔴" : todo.priority === "medium" ? "🟡" : "🟢"
      const dueDateStr = todo.dueDate ? `, due: ${new Date(todo.dueDate).toISOString().split("T")[0]}` : ""
      return Console.log(`${priorityEmoji} ${todo.title}, ${todo.status}${dueDateStr}`)
    })
    return todos
  })

export const updateTodoWithArgs = (args: UpdateTodoArgs) =>
  Effect.gen(function* () {
    const changes: UpdateTodoCommand["changes"] = {}

    if (args.title !== undefined) changes.title = args.title
    if (args.description !== undefined) changes.description = args.description
    if (args.priority !== undefined) changes.priority = args.priority
    if (args.status !== undefined) changes.status = args.status
    if (args.dueDate !== undefined) {
      const parsedDate = new Date(args.dueDate)
      if (Number.isNaN(parsedDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
      changes.dueDate = parsedDate.getTime()
    }

    const updatedTodo = yield* updateTodo({
      id: TodoId.make(args.id),
      changes
    })

    yield* Console.log(`Todo updated successfully: ${updatedTodo.title}`)
    return updatedTodo
  })

export const removeTodosWithArgs = (args: RemoveTodoArgs) =>
  Effect.gen(function* () {
    if (args.ids.length === 0) {
      yield* Console.log("No todo IDs provided.")
      return
    }

    const todos = yield* getTodos()
    const selectedTodos = todos.filter((todo) => args.ids.includes(TodoId.toString(todo.id)))

    if (selectedTodos.length === 0) {
      yield* Console.log("No matching todos found.")
      return
    }

    yield* Console.log(`\nRemoving ${selectedTodos.length} todos:`)
    yield* Effect.forEach(selectedTodos, (todo) => Console.log(`- ${todo.title}`))

    yield* removeTodos({
      ids: args.ids.map(TodoId.make)
    })

    yield* Console.log(`${selectedTodos.length} todos removed successfully.`)
  })

export const completeTodosWithArgs = (args: CompleteTodoArgs) =>
  Effect.gen(function* () {
    if (args.ids.length === 0) {
      yield* Console.log("No todo IDs provided.")
      return
    }

    const todos = yield* getTodos()
    const selectedTodos = todos.filter((todo) => args.ids.includes(TodoId.toString(todo.id)))

    if (selectedTodos.length === 0) {
      yield* Console.log("No matching todos found.")
      return
    }

    yield* Effect.forEach(selectedTodos, (todo) =>
      updateTodo({
        id: todo.id,
        changes: { status: "completed" }
      })
    )

    yield* Console.log(`${selectedTodos.length} todos completed successfully.`)
  })

export interface GenerateReportArgs {
  format?: "simple" | "detailed" | "json"
  status?: TodoStatus
  priority?: (typeof PRIORITY_ARRAY)[number]
  dateRange?: {
    from?: string
    to?: string
  }
}

export const generateReportWithArgs = (args: GenerateReportArgs = {}) =>
  Effect.gen(function* () {
    const filters: ReportFilters = {}

    // Apply filters if provided
    if (args.status) {
      filters.status = args.status
    }

    if (args.priority) {
      filters.priority = args.priority
    }

    if (args.dateRange) {
      if (args.dateRange.from) {
        const fromDate = new Date(args.dateRange.from)
        if (!Number.isNaN(fromDate.getTime())) {
          filters.dateRange = { ...filters.dateRange, from: fromDate.getTime() }
        }
      }
      if (args.dateRange.to) {
        const toDate = new Date(args.dateRange.to)
        if (!Number.isNaN(toDate.getTime())) {
          filters.dateRange = { ...filters.dateRange, to: toDate.getTime() }
        }
      }
    }

    // Generate report
    const stats = yield* Object.keys(filters).length > 0 ? generateFilteredReport(filters) : generateReport()

    // Format output based on requested format
    switch (args.format) {
      case "json":
        yield* Console.log(JSON.stringify(stats, null, 2))
        break

      case "detailed": {
        yield* Console.log("\n=== TODO STATISTICS REPORT ===\n")
        yield* Console.log(`Total Todos: ${stats.total}`)
        yield* Console.log(`Completion Rate: ${stats.completionRate}%`)
        yield* Console.log("")
        yield* Console.log("Status Breakdown:")
        yield* Console.log(
          `  - Unstarted: ${stats.byStatus.unstarted} (${stats.total > 0 ? Math.round((stats.byStatus.unstarted / stats.total) * 100) : 0}%)`
        )
        yield* Console.log(
          `  - In Progress: ${stats.byStatus.inProgress} (${stats.total > 0 ? Math.round((stats.byStatus.inProgress / stats.total) * 100) : 0}%)`
        )
        yield* Console.log(
          `  - Completed: ${stats.byStatus.completed} (${stats.total > 0 ? Math.round((stats.byStatus.completed / stats.total) * 100) : 0}%)`
        )
        yield* Console.log("")
        yield* Console.log("Priority Distribution:")
        yield* Console.log(
          `  - High: ${stats.byPriority.high} (${stats.total > 0 ? Math.round((stats.byPriority.high / stats.total) * 100) : 0}%)`
        )
        yield* Console.log(
          `  - Medium: ${stats.byPriority.medium} (${stats.total > 0 ? Math.round((stats.byPriority.medium / stats.total) * 100) : 0}%)`
        )
        yield* Console.log(
          `  - Low: ${stats.byPriority.low} (${stats.total > 0 ? Math.round((stats.byPriority.low / stats.total) * 100) : 0}%)`
        )
        yield* Console.log("")
        yield* Console.log("Time-based Insights:")
        yield* Console.log(`  - Overdue: ${stats.overdue}`)
        yield* Console.log(`  - Due This Week: ${stats.dueThisWeek}`)
        yield* Console.log(`  - Created This Week: ${stats.createdThisWeek}`)
        yield* Console.log(`  - Created This Month: ${stats.createdThisMonth}`)

        // Visual bar chart for status
        yield* Console.log("\nStatus Distribution:")
        const maxBarLength = 30
        const unstartedBar = stats.total > 0 ? Math.round((stats.byStatus.unstarted / stats.total) * maxBarLength) : 0
        const inProgressBar = stats.total > 0 ? Math.round((stats.byStatus.inProgress / stats.total) * maxBarLength) : 0
        const completedBar = stats.total > 0 ? Math.round((stats.byStatus.completed / stats.total) * maxBarLength) : 0

        yield* Console.log(
          `Unstarted  [${"#".repeat(unstartedBar)}${" ".repeat(maxBarLength - unstartedBar)}] ${stats.byStatus.unstarted}`
        )
        yield* Console.log(
          `In Progress [${"#".repeat(inProgressBar)}${" ".repeat(maxBarLength - inProgressBar)}] ${stats.byStatus.inProgress}`
        )
        yield* Console.log(
          `Completed  [${"#".repeat(completedBar)}${" ".repeat(maxBarLength - completedBar)}] ${stats.byStatus.completed}`
        )
        break
      }

      default:
        yield* Console.log("\n=== TODO REPORT ===")
        yield* Console.log(`Total: ${stats.total} | Completed: ${stats.byStatus.completed} (${stats.completionRate}%)`)
        yield* Console.log(`Status: Unstarted: ${stats.byStatus.unstarted} | In Progress: ${stats.byStatus.inProgress}`)
        yield* Console.log(
          `Priority: High: ${stats.byPriority.high} | Medium: ${stats.byPriority.medium} | Low: ${stats.byPriority.low}`
        )
        if (stats.overdue > 0) {
          yield* Console.log(`⚠️  Overdue: ${stats.overdue}`)
        }
        if (stats.dueThisWeek > 0) {
          yield* Console.log(`📅 Due This Week: ${stats.dueThisWeek}`)
        }
        break
    }

    return stats
  })
