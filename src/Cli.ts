import * as Command from "@effect/cli/Command"
import { Console } from "effect"

const addCommand = Command.make("add", {}, () =>
  Console.log("Adding todo...")
)

const command = Command.make("todo").pipe(
  Command.withSubcommands([addCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
