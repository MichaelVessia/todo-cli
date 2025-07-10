import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import { Console, Effect } from "effect"
import { PRIORITY_ARRAY } from "../domain/todo/PriorityConstants.js"
import { TodoRepositoryLayer } from "../infra/layers/TodoRepositoryLayer.js"
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
    if (args.title._tag === "Some") {
      return addTodoWithArgs({
        title: args.title.value,
        description: args.description._tag === "Some" ? args.description.value : undefined,
        priority: args.priority._tag === "Some" ? args.priority.value : undefined,
        dueDate: args.dueDate._tag === "Some" ? args.dueDate.value : undefined
      }).pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    } else {
      return promptForAddTodo().pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    }
  }
)

export const listCommand = Command.make("list", {}, () =>
  listTodosWithArgs().pipe(
    Effect.provide(TodoRepositoryLayer),
    Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
  )
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
      return updateTodoWithArgs({
        id: args.id.value,
        title: args.title._tag === "Some" ? args.title.value : undefined,
        description: args.description._tag === "Some" ? args.description.value : undefined,
        priority: args.priority._tag === "Some" ? args.priority.value : undefined,
        status: args.status._tag === "Some" ? args.status.value : undefined,
        dueDate: args.dueDate._tag === "Some" ? args.dueDate.value : undefined
      }).pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    } else {
      return promptForUpdateTodo().pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
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
      }).pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    } else {
      return promptForRemoveTodos().pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
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
      }).pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    } else {
      return promptForCompleteTodos().pipe(
        Effect.provide(TodoRepositoryLayer),
        Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
      )
    }
  }
)
