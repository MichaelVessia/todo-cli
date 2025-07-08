import * as Command from "@effect/cli/Command"
import { Console, Effect } from "effect"
import { TodoRepositoryLayer } from "../infra/layers/TodoRepositoryLayer.js"
import { promptForListTodos, promptForUpdateTodo, promptForAddTodo } from "./prompts.js"

export const addCommand = Command.make("add", {}, () => promptForAddTodo().pipe(
  Effect.provide(TodoRepositoryLayer),
  Effect.catchAll((error) =>
    Console.log(`Error: ${error.message}`)
  )
)
)

export const listCommand = Command.make("list", {}, () => promptForListTodos().pipe(
  Effect.provide(TodoRepositoryLayer),
  Effect.catchAll((error) =>
    Console.log(`Error: ${error.message}`)
  )
)
)

export const updateCommand = Command.make("update", {}, () => promptForUpdateTodo().pipe(
  Effect.provide(TodoRepositoryLayer),
  Effect.catchAll((error) =>
    Console.log(`Error: ${error.message}`)
  )
)
)

export const removeCommand = Command.make("remove", {}, () => Console.log("removing todo..."))

export const completeCommand = Command.make("complete", {}, () => Console.log("complete todo..."))
