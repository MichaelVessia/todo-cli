import * as Command from "@effect/cli/Command"
import * as Args from "@effect/cli/Args"
import * as Options from "@effect/cli/Options"
import { Console, Effect } from "effect"
import { addTodo, type AddTodoCommand } from "./application/commands/AddTodo.js"
import { TodoRepositoryLayer } from "./infra/layers/TodoRepositoryLayer.js"
import { getTodos } from "./application/commands/ListTodos.js"

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

const updateCommand = Command.make("update", {}, () => Console.log("updating todo..."))

const removeCommand = Command.make("remove", {}, () => Console.log("removing todo..."))

const completeCommand = Command.make("complete", {}, () => Console.log("complete todo..."))

const command = Command.make("todo").pipe(
  Command.withSubcommands([addCommand, listCommand, updateCommand, removeCommand, completeCommand])
)

export const run = Command.run(command, {
  name: "Todo CLI",
  version: "0.0.0"
})
