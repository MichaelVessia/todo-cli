import * as Command from "@effect/cli/Command"
import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { addCommand, completeCommand, listCommand, removeCommand, updateCommand } from "./commands.js"
import {
  promptForAddTodo,
  promptForCompleteTodos,
  promptForListTodos,
  promptForRemoveTodos,
  promptForUpdateTodo
} from "./prompts.js"

const interactiveCommand = Command.make("todo", {}, () =>
  Effect.gen(function* () {
    const action = yield* Prompt.select({
      message: "What would you like to do?",
      choices: [
        { title: "Add a new todo", value: "add" },
        { title: "List all todos", value: "list" },
        { title: "Update a todo", value: "update" },
        { title: "Remove todos", value: "remove" },
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
        yield* promptForRemoveTodos()
        break

      case "complete":
        yield* promptForCompleteTodos()
        break
    }
  }).pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
)

const command = interactiveCommand.pipe(
  Command.withSubcommands([addCommand, listCommand, updateCommand, removeCommand, completeCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
