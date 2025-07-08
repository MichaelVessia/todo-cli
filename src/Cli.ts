import * as Command from "@effect/cli/Command"
import * as Args from "@effect/cli/Args"
import * as Options from "@effect/cli/Options"
import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { addTodo, type AddTodoCommand } from "./application/commands/AddTodo.js"
import { TodoRepositoryLayer } from "./infra/layers/TodoRepositoryLayer.js"
import { getTodos } from "./application/commands/ListTodos.js"
import { updateTodo, UpdateTodoCommand } from "./application/commands/UpdateTodo.js"

const addCommand = Command.make("add", {
  args: Args.text({ name: "title" }),
  options: {
    description: Options.text("description").pipe(Options.withDefault("")),
    priority: Options.choice("priority", ["low", "medium", "high"]).pipe(Options.withDefault("medium" as const)),
    dueDate: Options.text("due-date").pipe(Options.withDefault(new Date().toISOString()))
  }
}, ({ args: title, options: { description, priority, dueDate } }) =>
  Effect.gen(function* () {
    const command: AddTodoCommand = {
      title,
      description,
      priority,
      dueDate: new Date(dueDate)
    }

    const result = yield* addTodo(command)
    yield* Console.log(`Todo added: ${result.title}`)
  }).pipe(
    Effect.provide(TodoRepositoryLayer),
    Effect.catchAll((error) =>
      Console.log(`Error: ${error.message}`)
    )
  )
)

const listCommand = Command.make("list", {}, () => Effect.gen(function* () {
  const result = yield* getTodos()
  yield* Effect.forEach(result, (res) => Console.log(`${res.title}, ${res.status}`))
}).pipe(
  Effect.provide(TodoRepositoryLayer),
  Effect.catchAll((error) =>
    Console.log(`Error: ${error.message}`)
  )
)
)

const updateCommand = Command.make("update", {}, () =>
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

    const selectedTodo = todos.find(todo => todo.id === selectedTodoId)
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

    let changes: any = {}

    switch (updateField) {
      case "title":
        const newTitle = yield* Prompt.text({
          message: "Enter new title:",
          default: selectedTodo.title
        })
        changes.title = newTitle
        break
      case "description":
        const newDescription = yield* Prompt.text({
          message: "Enter new description:",
          default: selectedTodo.description || ""
        })
        changes.description = newDescription
        break
      case "priority":
        const newPriority = yield* Prompt.select({
          message: "Select priority:",
          choices: [
            { title: "Low", value: "low" },
            { title: "Medium", value: "medium" },
            { title: "High", value: "high" }
          ]
        })
        changes.priority = newPriority
        break
      case "dueDate":
        const newDueDate = yield* Prompt.text({
          message: "Enter due date (YYYY-MM-DD):",
          default: selectedTodo.dueDate?.toISOString().split('T')[0] || ""
        })
        changes.dueDate = new Date(newDueDate)
        break
    }

    const updatedTodo = yield* updateTodo({
      id: selectedTodoId,
      changes
    })

    yield* Console.log(`Todo updated successfully: ${updatedTodo.title}`)
  }).pipe(
    Effect.provide(TodoRepositoryLayer),
    Effect.catchAll((error) =>
      Console.log(`Error: ${error.message}`)
    )
  )
)

const removeCommand = Command.make("remove", {}, () => Console.log("removing todo..."))

const completeCommand = Command.make("complete", {}, () => Console.log("complete todo..."))

const interactiveCommand = Command.make("todo", {}, () =>
  Effect.gen(function* () {
    const action = yield* Prompt.select({
      message: "What would you like to do?",
      choices: [
        { title: "Add a new todo", value: "add" },
        { title: "List all todos", value: "list" },
        { title: "Update a todo", value: "update" },
        { title: "Remove a todo", value: "remove" },
        { title: "Complete a todo", value: "complete" }
      ]
    })

    switch (action) {
      case "add":
        const title = yield* Prompt.text({
          message: "Enter todo title:"
        })

        const description = yield* Prompt.text({
          message: "Enter description (optional):",
          default: ""
        })

        const priority = yield* Prompt.select({
          message: "Select priority:",
          choices: [
            { title: "Low", value: "low" },
            { title: "Medium", value: "medium" },
            { title: "High", value: "high" }
          ]
        })

        const dueDate = yield* Prompt.text({
          message: "Enter due date (YYYY-MM-DD, optional):",
          default: new Date().toISOString().split('T')[0]
        })

        const command: AddTodoCommand = {
          title,
          description,
          priority: priority as "low" | "medium" | "high",
          dueDate: new Date(dueDate)
        }

        const result = yield* addTodo(command)
        yield* Console.log(`Todo added: ${result.title}`)
        break

      case "list":
        const todos = yield* getTodos()
        yield* Effect.forEach(todos, (todo) => Console.log(`${todo.title}, ${todo.status}`))
        break

      case "update":
        const updateTodos = yield* getTodos()

        if (updateTodos.length === 0) {
          yield* Console.log("No todos found!")
          return
        }

        const todoChoices = updateTodos.map((todo) => ({
          title: `${todo.title} (${todo.status}) - ${todo.priority}`,
          value: todo.id
        }))

        const selectedTodoId = yield* Prompt.select({
          message: "Select a todo to update:",
          choices: todoChoices
        })

        const selectedTodo = updateTodos.find(todo => todo.id === selectedTodoId)
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

        let changes: UpdateTodoCommand['changes'] = {}

        switch (updateField) {
          case "title":
            const newTitle = yield* Prompt.text({
              message: "Enter new title:",
              default: selectedTodo.title
            })
            changes.title = newTitle
            break
          case "description":
            const newDescription = yield* Prompt.text({
              message: "Enter new description:",
              default: selectedTodo.description || ""
            })
            changes.description = newDescription
            break
          case "priority":
            const newPriority = yield* Prompt.select({
              message: "Select priority:",
              choices: [
                { title: "Low", value: "low" as const },
                { title: "Medium", value: "medium" as const },
                { title: "High", value: "high" as const }
              ]
            })
            changes.priority = newPriority
            break
          case "dueDate":
            const newDueDate = yield* Prompt.text({
              message: "Enter due date (YYYY-MM-DD):",
              default: selectedTodo.dueDate?.toISOString().split('T')[0] || ""
            })
            changes.dueDate = new Date(newDueDate)
            break
        }

        const updatedTodo = yield* updateTodo({
          id: selectedTodoId,
          changes
        })

        yield* Console.log(`Todo updated successfully: ${updatedTodo.title}`)
        break

      case "remove":
        yield* Console.log("removing todo...")
        break

      case "complete":
        yield* Console.log("complete todo...")
        break
    }
  }).pipe(
    Effect.provide(TodoRepositoryLayer),
    Effect.catchAll((error) =>
      Console.log(`Error: ${error.message}`)
    )
  )
)

const command = interactiveCommand.pipe(
  Command.withSubcommands([addCommand, listCommand, updateCommand, removeCommand, completeCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
