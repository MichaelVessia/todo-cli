import { Clock, Effect } from "effect"
import type * as Types from "effect/Clock"
import { isCompleted, type Todo } from "../domain/todo/Todo.js"
import type { TodoRepositoryError } from "../domain/todo/TodoErrors.js"
import { TodoRepository } from "../domain/todo/TodoRepository.js"

export interface TodoStatistics {
  total: number
  byStatus: {
    unstarted: number
    inProgress: number
    completed: number
  }
  byPriority: {
    high: number
    medium: number
    low: number
  }
  completionRate: number
  overdue: number
  dueThisWeek: number
  createdThisWeek: number
  createdThisMonth: number
}

export const generateReport = (): Effect.Effect<TodoStatistics, TodoRepositoryError, TodoRepository | Types.Clock> =>
  Effect.gen(function* () {
    const repository = yield* TodoRepository
    const todos = yield* repository.findAll()
    const now = yield* Clock.currentTimeMillis

    // Calculate date boundaries
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

    // Initialize counters
    const stats: TodoStatistics = {
      total: todos.length,
      byStatus: {
        unstarted: 0,
        inProgress: 0,
        completed: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      completionRate: 0,
      overdue: 0,
      dueThisWeek: 0,
      createdThisWeek: 0,
      createdThisMonth: 0
    }

    // Count todos by various criteria
    for (const todo of todos) {
      // Status counts
      switch (todo.status) {
        case "unstarted":
          stats.byStatus.unstarted++
          break
        case "in_progress":
          stats.byStatus.inProgress++
          break
        case "completed":
          stats.byStatus.completed++
          break
      }

      // Priority counts
      switch (todo.priority) {
        case "high":
          stats.byPriority.high++
          break
        case "medium":
          stats.byPriority.medium++
          break
        case "low":
          stats.byPriority.low++
          break
      }

      // Check if overdue
      if (todo.dueDate && todo.dueDate < now && !isCompleted(todo)) {
        stats.overdue++
      }

      // Check if due this week
      if (todo.dueDate && todo.dueDate >= now && todo.dueDate <= oneWeekFromNow && !isCompleted(todo)) {
        stats.dueThisWeek++
      }

      // Check creation dates
      if (todo.createdAt >= oneWeekAgo) {
        stats.createdThisWeek++
      }
      if (todo.createdAt >= oneMonthAgo) {
        stats.createdThisMonth++
      }
    }

    // Calculate completion rate
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.byStatus.completed / stats.total) * 100)
    }

    return stats
  })

export interface DateRangeFilter {
  from?: number
  to?: number
}

export interface ReportFilters {
  status?: Todo["status"]
  priority?: Todo["priority"]
  dateRange?: DateRangeFilter
}

export const generateFilteredReport = (
  filters: ReportFilters
): Effect.Effect<TodoStatistics, TodoRepositoryError, TodoRepository | Types.Clock> =>
  Effect.gen(function* () {
    const repository = yield* TodoRepository
    let todos = yield* repository.findAll()

    // Apply filters
    if (filters.status) {
      todos = todos.filter((todo) => todo.status === filters.status)
    }

    if (filters.priority) {
      todos = todos.filter((todo) => todo.priority === filters.priority)
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        const fromTime = filters.dateRange.from
        todos = todos.filter((todo) => todo.createdAt >= fromTime)
      }
      if (filters.dateRange.to) {
        const toTime = filters.dateRange.to
        todos = todos.filter((todo) => todo.createdAt <= toTime)
      }
    }

    // Generate report for filtered todos
    const now = yield* Clock.currentTimeMillis
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

    const stats: TodoStatistics = {
      total: todos.length,
      byStatus: {
        unstarted: 0,
        inProgress: 0,
        completed: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      completionRate: 0,
      overdue: 0,
      dueThisWeek: 0,
      createdThisWeek: 0,
      createdThisMonth: 0
    }

    for (const todo of todos) {
      // Status counts
      switch (todo.status) {
        case "unstarted":
          stats.byStatus.unstarted++
          break
        case "in_progress":
          stats.byStatus.inProgress++
          break
        case "completed":
          stats.byStatus.completed++
          break
      }

      // Priority counts
      switch (todo.priority) {
        case "high":
          stats.byPriority.high++
          break
        case "medium":
          stats.byPriority.medium++
          break
        case "low":
          stats.byPriority.low++
          break
      }

      // Check if overdue
      if (todo.dueDate && todo.dueDate < now && !isCompleted(todo)) {
        stats.overdue++
      }

      // Check if due this week
      if (todo.dueDate && todo.dueDate >= now && todo.dueDate <= oneWeekFromNow && !isCompleted(todo)) {
        stats.dueThisWeek++
      }

      // Check creation dates
      if (todo.createdAt >= oneWeekAgo) {
        stats.createdThisWeek++
      }
      if (todo.createdAt >= oneMonthAgo) {
        stats.createdThisMonth++
      }
    }

    // Calculate completion rate
    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.byStatus.completed / stats.total) * 100)
    }

    return stats
  })
