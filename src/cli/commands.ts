import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import { Console, Effect, Option } from "effect"
import { PRIORITY_ARRAY } from "../domain/todo/PriorityConstants.js"
import {
  addTodoWithArgs,
  completeTodosWithArgs,
  listTodosWithArgs,
  removeTodosWithArgs,
  updateTodoWithArgs
} from "./core-handlers.js"
import { promptForAddTodo, promptForCompleteTodos, promptForRemoveTodos, promptForUpdateTodo } from "./prompts.js"

const addTitle = Options.text("title").pipe(Options.withAlias("t"), Options.optional)
const addDescription = Options.text("description").pipe(Options.withAlias("d"), Options.optional)
const addPriority = Options.choice("priority", PRIORITY_ARRAY).pipe(Options.withAlias("p"), Options.optional)
const addDueDate = Options.text("due-date").pipe(Options.optional)

export const addCommand = Command.make(
  "add",
  {
    title: addTitle,
    description: addDescription,
    priority: addPriority,
    dueDate: addDueDate
  },
  (args) => {
    const action = Option.match(args.title, {
      onNone: () =>
        promptForAddTodo().pipe(
          Effect.asVoid,
          Effect.catchTag("QuitException", () => Effect.void)
        ),
      onSome: (title) =>
        addTodoWithArgs({
          title,
          description: Option.getOrElse(args.description, () => ""),
          priority: Option.getOrElse(args.priority, () => "medium" as const),
          dueDate: Option.getOrElse(args.dueDate, () => undefined)
        }).pipe(Effect.asVoid)
    })

    return action.pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
  }
)

export const listCommand = Command.make("list", {}, () =>
  listTodosWithArgs().pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
)

const STATUS_ARRAY = ["unstarted", "in_progress", "completed"] as const

const updateId = Options.text("id").pipe(Options.optional)
const updateTitle = Options.text("title").pipe(Options.withAlias("t"), Options.optional)
const updateDescription = Options.text("description").pipe(Options.withAlias("d"), Options.optional)
const updatePriority = Options.choice("priority", PRIORITY_ARRAY).pipe(Options.withAlias("p"), Options.optional)
const updateStatus = Options.choice("status", STATUS_ARRAY).pipe(Options.withAlias("s"), Options.optional)
const updateDueDate = Options.text("due-date").pipe(Options.optional)

export const updateCommand = Command.make(
  "update",
  {
    id: updateId,
    title: updateTitle,
    description: updateDescription,
    priority: updatePriority,
    status: updateStatus,
    dueDate: updateDueDate
  },
  (args) => {
    if (args.id._tag === "Some") {
      const updateArgs: any = { id: args.id.value }
      if (args.title._tag === "Some") updateArgs.title = args.title.value
      if (args.description._tag === "Some") updateArgs.description = args.description.value
      if (args.priority._tag === "Some") updateArgs.priority = args.priority.value
      if (args.status._tag === "Some") updateArgs.status = args.status.value
      if (args.dueDate._tag === "Some") updateArgs.dueDate = args.dueDate.value

      return updateTodoWithArgs(updateArgs).pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    } else {
      return promptForUpdateTodo().pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    }
  }
)

const removeIds = Options.text("id").pipe(Options.repeated, Options.optional)

export const removeCommand = Command.make(
  "remove",
  {
    ids: removeIds
  },
  (args) => {
    if (args.ids._tag === "Some" && args.ids.value.length > 0) {
      return removeTodosWithArgs({
        ids: args.ids.value
      }).pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    } else {
      return promptForRemoveTodos().pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    }
  }
)

const completeIds = Options.text("id").pipe(Options.repeated, Options.optional)

export const completeCommand = Command.make(
  "complete",
  {
    ids: completeIds
  },
  (args) => {
    if (args.ids._tag === "Some" && args.ids.value.length > 0) {
      return completeTodosWithArgs({
        ids: args.ids.value
      }).pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    } else {
      return promptForCompleteTodos().pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
    }
  }
)
