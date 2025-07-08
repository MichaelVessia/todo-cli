import * as Command from "@effect/cli/Command"
import * as Args from "@effect/cli/Args"
import * as Options from "@effect/cli/Options"
import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { addTodo, type AddTodoCommand } from "./application/commands/AddTodo.js"
import { TodoRepositoryLayer } from "./infra/layers/TodoRepositoryLayer.js"
import { getTodos } from "./application/commands/ListTodos.js"
import { updateTodo, UpdateTodoCommand } from "./application/commands/UpdateTodo.js"
import { PRIORITY_ARRAY, PRIORITY_CHOICES, DEFAULT_PRIORITY } from "./domain/todo/PriorityConstants.js"

const promptForAddTodo = () => Effect.gen(function* () {
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
    default: new Date().toISOString().split('T')[0]
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

const addCommand = Command.make("add", {
  args: Args.text({ name: "title" }),
  options: {
    description: Options.text("description").pipe(Options.withDefault("")),
    priority: Options.choice("priority", PRIORITY_ARRAY).pipe(Options.withDefault(DEFAULT_PRIORITY)),
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

const promptForListTodos = () => Effect.gen(function* () {
  const todos = yield* getTodos()
  yield* Effect.forEach(todos, (todo) => Console.log(`${todo.title}, ${todo.status}`))
})

const listCommand = Command.make("list", {}, () => promptForListTodos().pipe(
  Effect.provide(TodoRepositoryLayer),
  Effect.catchAll((error) =>
    Console.log(`Error: ${error.message}`)
  )
)
)

const promptForUpdateTodo = () => Effect.gen(function* () {
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
        choices: PRIORITY_CHOICES
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
})

const updateCommand = Command.make("update", {}, () => promptForUpdateTodo().pipe(
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
        yield* promptForAddTodo()
        break

      case "list":
        yield* promptForListTodos()
        break

      case "update":
        yield* promptForUpdateTodo()
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
