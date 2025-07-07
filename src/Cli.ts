import * as Command from "@effect/cli/Command"
import { Console } from "effect"

const addCommand = Command.make("add", {}, () =>
  Console.log("Adding todo...")
)

const listCommand = Command.make("list", {}, () =>
  Console.log("Listing todos...")
)

const updateCommand = Command.make("update", {}, () =>
  Console.log("updating todo...")
)

const removeCommand = Command.make("remove", {}, () =>
  Console.log("removing todo...")
)

const completeCommand = Command.make("complete", {}, () =>
  Console.log("complete todo...")
)

const command = Command.make("todo").pipe(
  Command.withSubcommands([addCommand, listCommand, updateCommand, removeCommand, completeCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
