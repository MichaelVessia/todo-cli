import * as Command from "@effect/cli/Command"
import * as Options from "@effect/cli/Options"
import { Console, Effect, Option } from "effect"
import { PRIORITY_ARRAY } from "../domain/todo/PriorityConstants.js"
import {
  addTodoWithArgs,
  completeTodosWithArgs,
  generateReportWithArgs,
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
    const action = Option.match(args.id, {
      onNone: () =>
        promptForUpdateTodo().pipe(
          Effect.asVoid,
          Effect.catchTag("QuitException", () => Effect.void)
        ),
      onSome: (id) => {
        const updateArgs: any = { id }
        Option.match(args.title, {
          onNone: () => {},
          onSome: (title) => {
            updateArgs.title = title
          }
        })
        Option.match(args.description, {
          onNone: () => {},
          onSome: (description) => {
            updateArgs.description = description
          }
        })
        Option.match(args.priority, {
          onNone: () => {},
          onSome: (priority) => {
            updateArgs.priority = priority
          }
        })
        Option.match(args.status, {
          onNone: () => {},
          onSome: (status) => {
            updateArgs.status = status
          }
        })
        Option.match(args.dueDate, {
          onNone: () => {},
          onSome: (dueDate) => {
            updateArgs.dueDate = dueDate
          }
        })

        return updateTodoWithArgs(updateArgs).pipe(Effect.asVoid)
      }
    })

    return action.pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
  }
)

const removeIds = Options.text("id").pipe(Options.repeated, Options.optional)

export const removeCommand = Command.make(
  "remove",
  {
    ids: removeIds
  },
  (args) => {
    const action = Option.match(args.ids, {
      onNone: () =>
        promptForRemoveTodos().pipe(
          Effect.asVoid,
          Effect.catchTag("QuitException", () => Effect.void)
        ),
      onSome: (ids) =>
        ids.length > 0
          ? removeTodosWithArgs({ ids }).pipe(Effect.asVoid)
          : promptForRemoveTodos().pipe(
              Effect.asVoid,
              Effect.catchTag("QuitException", () => Effect.void)
            )
    })

    return action.pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
  }
)

const completeIds = Options.text("id").pipe(Options.repeated, Options.optional)

export const completeCommand = Command.make(
  "complete",
  {
    ids: completeIds
  },
  (args) => {
    const action = Option.match(args.ids, {
      onNone: () =>
        promptForCompleteTodos().pipe(
          Effect.asVoid,
          Effect.catchTag("QuitException", () => Effect.void)
        ),
      onSome: (ids) =>
        ids.length > 0
          ? completeTodosWithArgs({ ids }).pipe(Effect.asVoid)
          : promptForCompleteTodos().pipe(
              Effect.asVoid,
              Effect.catchTag("QuitException", () => Effect.void)
            )
    })

    return action.pipe(Effect.catchAll((error) => Console.log(`Error: ${error.message}`)))
  }
)

const reportFormat = Options.choice("format", ["simple", "detailed", "json"] as const).pipe(
  Options.withAlias("f"),
  Options.optional
)
const reportStatus = Options.choice("status", STATUS_ARRAY).pipe(Options.optional)
const reportPriority = Options.choice("priority", PRIORITY_ARRAY).pipe(Options.optional)
const reportFromDate = Options.text("from").pipe(Options.optional)
const reportToDate = Options.text("to").pipe(Options.optional)

export const reportCommand = Command.make(
  "report",
  {
    format: reportFormat,
    status: reportStatus,
    priority: reportPriority,
    from: reportFromDate,
    to: reportToDate
  },
  (args) => {
    const reportArgs: any = {}

    Option.match(args.format, {
      onNone: () => {},
      onSome: (format) => {
        reportArgs.format = format
      }
    })

    Option.match(args.status, {
      onNone: () => {},
      onSome: (status) => {
        reportArgs.status = status
      }
    })

    Option.match(args.priority, {
      onNone: () => {},
      onSome: (priority) => {
        reportArgs.priority = priority
      }
    })

    const dateRange: any = {}
    Option.match(args.from, {
      onNone: () => {},
      onSome: (from) => {
        dateRange.from = from
      }
    })

    Option.match(args.to, {
      onNone: () => {},
      onSome: (to) => {
        dateRange.to = to
      }
    })

    if (Object.keys(dateRange).length > 0) {
      reportArgs.dateRange = dateRange
    }

    return generateReportWithArgs(reportArgs).pipe(
      Effect.asVoid,
      Effect.catchAll((error) => Console.log(`Error: ${error.message}`))
    )
  }
)
