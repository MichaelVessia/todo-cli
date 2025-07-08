import * as Command from "@effect/cli/Command"
import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { TodoRepositoryLayer } from "./infra/layers/TodoRepositoryLayer.js"
import { addCommand, listCommand, updateCommand, removeCommand, completeCommand } from "./cli/commands.js"
import { promptForAddTodo, promptForListTodos, promptForRemoveTodo, promptForUpdateTodo } from "./cli/prompts.js"

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
        yield* promptForRemoveTodo()
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
