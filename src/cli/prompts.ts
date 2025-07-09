import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { PRIORITY_CHOICES } from "../domain/todo/PriorityConstants.js"
import { configManager } from "../infra/config/ConfigManager.js"
import { getTodos } from "../operations/ListTodos.js"
import {
  addTodoWithArgs,
  completeTodosWithArgs,
  listTodosWithArgs,
  removeTodosWithArgs,
  switchDatabaseWithArgs,
  updateTodoWithArgs
} from "./core-handlers.js"

export const promptForAddTodo = () =>
  Effect.gen(function* () {
    const title = yield* Prompt.text({
      message: "Enter todo title:"
    })

    const description = yield* Prompt.text({
      message: "Enter description (optional):",
      default: ""
    })

    const priority = yield* Prompt.select({
      message: "Select priority:",
      choices: PRIORITY_CHOICES
    })

    const dueDate = yield* Prompt.text({
      message: "Enter due date (YYYY-MM-DD, optional):",
      default: new Date().toISOString().split("T")[0]
    })

    yield* addTodoWithArgs({
      title,
      description,
      priority,
      dueDate: dueDate.trim() !== "" ? dueDate : undefined
    })
  })

export const promptForListTodos = () =>
  Effect.gen(function* () {
    yield* listTodosWithArgs()
  })

export const promptForUpdateTodo = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()

    if (todos.length === 0) {
      yield* Console.log("No todos found!")
      return
    }

    const todoChoices = todos.map((todo) => ({
      title: `${todo.title} (${todo.status}) - ${todo.priority}`,
      value: todo.id
    }))

    const selectedTodoId = yield* Prompt.select({
      message: "Select a todo to update:",
      choices: todoChoices
    })

    const selectedTodo = todos.find((todo) => todo.id === selectedTodoId)
    if (!selectedTodo) {
      yield* Console.log("Todo not found!")
      return
    }

    yield* Console.log(`\nUpdating: ${selectedTodo.title}`)

    const updateField = yield* Prompt.select({
      message: "What would you like to update?",
      choices: [
        { title: "Title", value: "title" },
        { title: "Description", value: "description" },
        { title: "Priority", value: "priority" },
        { title: "Due Date", value: "dueDate" }
      ]
    })

    const args: any = { id: selectedTodoId }

    switch (updateField) {
      case "title": {
        const newTitle = yield* Prompt.text({
          message: "Enter new title:",
          default: selectedTodo.title
        })
        args.title = newTitle
        break
      }
      case "description": {
        const newDescription = yield* Prompt.text({
          message: "Enter new description:",
          default: selectedTodo.description || ""
        })
        args.description = newDescription
        break
      }
      case "priority": {
        const newPriority = yield* Prompt.select({
          message: "Select priority:",
          choices: PRIORITY_CHOICES
        })
        args.priority = newPriority
        break
      }
      case "dueDate": {
        const newDueDate = yield* Prompt.text({
          message: "Enter due date (YYYY-MM-DD):",
          default: selectedTodo.dueDate?.toISOString().split("T")[0] || ""
        })
        args.dueDate = newDueDate
        break
      }
    }

    yield* updateTodoWithArgs(args)
  })

export const promptForRemoveTodos = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()

    if (todos.length === 0) {
      yield* Console.log("No todos found!")
      return
    }

    const todoChoices = todos.map((todo) => ({
      title: `${todo.title} (${todo.status}) - ${todo.priority}`,
      value: todo.id
    }))

    const selectedTodoIds = yield* Prompt.multiSelect({
      message: "Select todos to remove:",
      choices: todoChoices
    })

    if (selectedTodoIds.length === 0) {
      yield* Console.log("No todos selected.")
      return
    }

    yield* removeTodosWithArgs({
      ids: selectedTodoIds
    })
  })

export const promptForCompleteTodos = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()

    if (todos.length === 0) {
      yield* Console.log("No todos found!")
      return
    }

    const todoChoices = todos.map((todo) => ({
      title: `${todo.title} (${todo.status}) - ${todo.priority}`,
      value: todo.id
    }))

    const selectedTodoIds = yield* Prompt.multiSelect({
      message: "Select todos to complete:",
      choices: todoChoices
    })

    if (selectedTodoIds.length === 0) {
      yield* Console.log("No todos selected.")
      return
    }

    yield* completeTodosWithArgs({
      ids: selectedTodoIds
    })
  })

export const promptForSwitchDatabase = () =>
  Effect.gen(function* () {
    const currentConfig = yield* configManager.getDataProviderConfig()

    const allChoices = [
      { title: "JSON File", value: "json" },
      { title: "Markdown File", value: "markdown" }
    ]

    // Filter out current database type from choices
    const availableChoices = allChoices.filter((choice) => choice.value !== currentConfig.type)

    if (availableChoices.length === 0) {
      yield* Console.log("No other database providers available to switch to.")
      return
    }

    const providerType = yield* Prompt.select({
      message: "Select database provider:",
      choices: availableChoices
    })

    let filePath: string | undefined

    if (providerType === "json" || providerType === "markdown") {
      const useCustomPath = yield* Prompt.confirm({
        message: "Use custom file path?",
        default: false
      })

      if (useCustomPath) {
        const extension = providerType === "json" ? "json" : "md"
        const currentFilePath = "filePath" in currentConfig ? currentConfig.filePath : undefined

        const getCustomPath = (): Effect.Effect<string, never, never> =>
          Effect.gen(function* () {
            const inputPath = yield* Prompt.text({
              message: `Enter file path for ${providerType} database:`,
              default: `~/todos.${extension}`
            })

            // Check if this would be the same as current database
            if (currentConfig.type === providerType && currentFilePath === inputPath) {
              yield* Console.log("This is the same as your current database. Please choose a different file path.")
              return yield* getCustomPath()
            }

            return inputPath
          })

        filePath = yield* getCustomPath()
      } else {
        // Check if default path would be the same as current database
        const currentFilePath = "filePath" in currentConfig ? currentConfig.filePath : undefined
        if (currentConfig.type === providerType && currentFilePath === undefined) {
          yield* Console.log(
            "This would use the same default database you're already using. Please use a custom file path instead."
          )
          return
        }
      }
    }

    yield* switchDatabaseWithArgs({
      provider: providerType,
      filePath
    })
  })
