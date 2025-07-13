import * as Command from "@effect/cli/Command"
import * as Prompt from "@effect/cli/Prompt"
import { Console, Effect } from "effect"
import { addCommand, completeCommand, listCommand, removeCommand, reportCommand, updateCommand } from "./commands.js"
import { generateReportWithArgs } from "./core-handlers.js"
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
        { title: "Complete a todo", value: "complete" },
        { title: "Generate a report", value: "report" }
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

      case "report":
        yield* Console.log("Generating report...")
        yield* generateReportWithArgs()
        break
    }
  }).pipe(Effect.catchAll((error) => Console.log(`Error: ${error instanceof Error ? error.message : String(error)}`)))
)

const command = interactiveCommand.pipe(
  Command.withSubcommands([addCommand, listCommand, updateCommand, removeCommand, completeCommand, reportCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
