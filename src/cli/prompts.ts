import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { PRIORITY_CHOICES } from "../domain/todo/PriorityConstants.js"
import { getTodos } from "../operations/ListTodos.js"
import {
  addTodoWithArgs,
  completeTodosWithArgs,
  listTodosWithArgs,
  removeTodosWithArgs,
  updateTodoWithArgs
} from "./core-handlers.js"

const STATUS_CHOICES = [
  { title: "Unstarted", value: "unstarted" },
  { title: "In Progress", value: "in_progress" },
  { title: "Completed", value: "completed" }
] as const

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
        { title: "Status", value: "status" },
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
      case "status": {
        const newStatus = yield* Prompt.select({
          message: "Select status:",
          choices: STATUS_CHOICES
        })
        args.status = newStatus
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
