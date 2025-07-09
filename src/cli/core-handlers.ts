import { Console, Effect } from "effect"
import { type PRIORITY_ARRAY, PRIORITY_VALUES } from "../domain/todo/PriorityConstants.js"
import { configManager } from "../infra/config/ConfigManager.js"
import { type AddTodoCommand, addTodo } from "../operations/AddTodo.js"
import { getTodos } from "../operations/ListTodos.js"
import { removeTodos } from "../operations/RemoveTodo.js"
import { switchDatabase } from "../operations/SwitchDatabase.js"
import { syncCurrentWithDatabase } from "../operations/SyncTodos.js"
import type { UpdateTodoCommand } from "../operations/UpdateTodo.js"
import { updateTodo } from "../operations/UpdateTodo.js"

export interface AddTodoArgs {
  title: string
  description?: string
  priority?: (typeof PRIORITY_ARRAY)[number]
  dueDate?: string
}

export interface UpdateTodoArgs {
  id: string
  title?: string
  description?: string
  priority?: (typeof PRIORITY_ARRAY)[number]
  dueDate?: string
}

export interface RemoveTodoArgs {
  ids: string[]
}

export interface CompleteTodoArgs {
  ids: string[]
}

export interface SwitchDatabaseArgs {
  provider: "json" | "markdown" | "memory"
  filePath?: string
}

export interface SyncDatabaseArgs {
  targetProvider: "json" | "markdown" | "memory"
  targetFilePath?: string
}

export const addTodoWithArgs = (args: AddTodoArgs) =>
  Effect.gen(function* () {
    let dueDate: Date | undefined
    if (args.dueDate && args.dueDate.trim() !== "") {
      dueDate = new Date(args.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
    }

    const command: AddTodoCommand = {
      title: args.title,
      description: args.description || "",
      priority: args.priority || PRIORITY_VALUES.MEDIUM,
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
    yield* Effect.forEach(todos, (todo) => Console.log(`${todo.title}, ${todo.status}`))
    return todos
  })

export const updateTodoWithArgs = (args: UpdateTodoArgs) =>
  Effect.gen(function* () {
    const changes: UpdateTodoCommand["changes"] = {}

    if (args.title !== undefined) changes.title = args.title
    if (args.description !== undefined) changes.description = args.description
    if (args.priority !== undefined) changes.priority = args.priority
    if (args.dueDate !== undefined) {
      const dueDate = new Date(args.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        yield* Console.log(`Invalid due date format: ${args.dueDate}. Please use YYYY-MM-DD format.`)
        return
      }
      changes.dueDate = dueDate
    }

    const updatedTodo = yield* updateTodo({
      id: args.id,
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
    const selectedTodos = todos.filter((todo) => args.ids.includes(todo.id))

    if (selectedTodos.length === 0) {
      yield* Console.log("No matching todos found.")
      return
    }

    yield* Console.log(`\nRemoving ${selectedTodos.length} todos:`)
    yield* Effect.forEach(selectedTodos, (todo) => Console.log(`- ${todo.title}`))

    yield* removeTodos({
      ids: args.ids
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
    const selectedTodos = todos.filter((todo) => args.ids.includes(todo.id))

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

export const switchDatabaseWithArgs = (args: SwitchDatabaseArgs) =>
  Effect.gen(function* () {
    const config: any = { type: args.provider }

    if (args.filePath && (args.provider === "json" || args.provider === "markdown")) {
      config.filePath = args.filePath
    }

    yield* switchDatabase(config)
    yield* Console.log(`Switched to ${args.provider} database${args.filePath ? ` at ${args.filePath}` : ""}`)
  })

export const syncDatabaseWithArgs = (args: SyncDatabaseArgs) =>
  Effect.gen(function* () {
    const currentConfig = yield* configManager.getDataProviderConfig()

    if (currentConfig.type === args.targetProvider) {
      const currentFilePath = "filePath" in currentConfig ? currentConfig.filePath : undefined
      if (currentFilePath === args.targetFilePath) {
        yield* Console.log("Target database is the same as current database.")
        return
      }
    }

    const targetConfig: any = { type: args.targetProvider }

    if (args.targetFilePath && (args.targetProvider === "json" || args.targetProvider === "markdown")) {
      targetConfig.filePath = args.targetFilePath
    }

    yield* syncCurrentWithDatabase(targetConfig)
    yield* Console.log(
      `Synced with ${args.targetProvider} database${args.targetFilePath ? ` at ${args.targetFilePath}` : ""}`
    )
  })
