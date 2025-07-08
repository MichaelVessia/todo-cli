import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { addTodo, type AddTodoCommand } from "../application/commands/AddTodo.js"
import { getTodos } from "../application/commands/ListTodos.js"
import { removeTodos } from "../application/commands/RemoveTodo.js"
import type { UpdateTodoCommand } from "../application/commands/UpdateTodo.js"
import { updateTodo } from "../application/commands/UpdateTodo.js"
import { PRIORITY_CHOICES } from "../domain/todo/PriorityConstants.js"

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

    const command: AddTodoCommand = {
      title,
      description,
      priority,
      dueDate: new Date(dueDate)
    }

    const result = yield* addTodo(command)
    yield* Console.log(`Todo added: ${result.title}`)
  })

export const promptForListTodos = () =>
  Effect.gen(function* () {
    const todos = yield* getTodos()
    yield* Effect.forEach(todos, (todo) => Console.log(`${todo.title}, ${todo.status}`))
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

    const changes: UpdateTodoCommand["changes"] = {}

    switch (updateField) {
      case "title": {
        const newTitle = yield* Prompt.text({
          message: "Enter new title:",
          default: selectedTodo.title
        })
        changes.title = newTitle
        break
      }
      case "description": {
        const newDescription = yield* Prompt.text({
          message: "Enter new description:",
          default: selectedTodo.description || ""
        })
        changes.description = newDescription
        break
      }
      case "priority": {
        const newPriority = yield* Prompt.select({
          message: "Select priority:",
          choices: PRIORITY_CHOICES
        })
        changes.priority = newPriority
        break
      }
      case "dueDate": {
        const newDueDate = yield* Prompt.text({
          message: "Enter due date (YYYY-MM-DD):",
          default: selectedTodo.dueDate?.toISOString().split("T")[0] || ""
        })
        changes.dueDate = new Date(newDueDate)
        break
      }
    }

    const updatedTodo = yield* updateTodo({
      id: selectedTodoId,
      changes
    })

    yield* Console.log(`Todo updated successfully: ${updatedTodo.title}`)
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

    const selectedTodos = todos.filter((todo) => selectedTodoIds.includes(todo.id))

    yield* Console.log(`\nRemoving ${selectedTodos.length} todos:`)
    yield* Effect.forEach(selectedTodos, (todo) => Console.log(`- ${todo.title}`))
    yield* removeTodos({
      ids: selectedTodoIds
    })
    yield* Console.log(`${selectedTodos.length} todos removed successfully.`)
  })
