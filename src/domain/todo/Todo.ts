import { Schema } from "@effect/schema"
import { Clock, Data, Effect } from "effect"
import type * as Types from "effect/Clock"
import { DEFAULT_PRIORITY, PRIORITY_VALUES } from "./PriorityConstants.js"
import { TodoId, TodoIdSchema } from "./TodoId.js"

export const TodoStatus = Schema.Literal("unstarted", "in_progress", "completed")
export type TodoStatus = Schema.Schema.Type<typeof TodoStatus>

export const TodoPriority = Schema.Literal("low", "medium", "high")
export type TodoPriority = Schema.Schema.Type<typeof TodoPriority>

export const TodoSchema = Schema.Struct({
  id: TodoIdSchema,
  title: Schema.String.pipe(Schema.nonEmptyString()),
  description: Schema.optional(Schema.String),
  status: TodoStatus,
  priority: TodoPriority,
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  dueDate: Schema.optional(Schema.Number)
})

export class Todo extends Data.Class<{
  readonly id: TodoId
  readonly title: string
  readonly description?: string
  readonly status: TodoStatus
  readonly priority: TodoPriority
  readonly createdAt: number
  readonly updatedAt: number
  readonly dueDate?: number
}> {}

export const makeTodo = (props: {
  title: string
  description?: string
  priority?: TodoPriority
  dueDate?: number
}): Effect.Effect<Todo, never, Types.Clock> =>
  Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis

    // Validate that the due date is valid if provided
    if (props.dueDate && !Number.isInteger(props.dueDate)) {
      throw new Error("Invalid due date timestamp")
    }

    return new Todo({
      id: TodoId.generate(),
      title: props.title,
      ...(props.description ? { description: props.description } : {}),
      status: "unstarted" as const,
      priority: props.priority ?? DEFAULT_PRIORITY,
      createdAt: now,
      updatedAt: now,
      ...(props.dueDate ? { dueDate: props.dueDate } : {})
    })
  })

export const complete = (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
  Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis
    return new Todo({
      ...todo,
      status: "completed",
      updatedAt: now
    })
  })

export const start = (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
  Effect.gen(function* () {
    const now = yield* Clock.currentTimeMillis
    return new Todo({
      ...todo,
      status: "in_progress",
      updatedAt: now
    })
  })

export const updateTitle =
  (title: string) =>
  (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      return new Todo({
        ...todo,
        title,
        updatedAt: now
      })
    })

export const updateDescription =
  (description: string) =>
  (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      return new Todo({
        ...todo,
        description,
        updatedAt: now
      })
    })

export const updatePriority =
  (priority: TodoPriority) =>
  (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      return new Todo({
        ...todo,
        priority,
        updatedAt: now
      })
    })

export const updateDueDate =
  (dueDate: number) =>
  (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      return new Todo({
        ...todo,
        dueDate,
        updatedAt: now
      })
    })

export const updateStatus =
  (status: TodoStatus) =>
  (todo: Todo): Effect.Effect<Todo, never, Types.Clock> =>
    Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      return new Todo({
        ...todo,
        status,
        updatedAt: now
      })
    })

export const isCompleted = (todo: Todo): boolean => todo.status === "completed"

export const isUnstarted = (todo: Todo): boolean => todo.status === "unstarted"

export const isInProgress = (todo: Todo): boolean => todo.status === "in_progress"

export const isOverdue = (todo: Todo): Effect.Effect<boolean, never, Types.Clock> =>
  Effect.gen(function* () {
    if (todo.dueDate === undefined || isCompleted(todo)) {
      return false
    }
    const now = yield* Clock.currentTimeMillis
    return todo.dueDate < now
  })

export const isHighPriority = (todo: Todo): boolean => todo.priority === PRIORITY_VALUES.HIGH

export const isMediumPriority = (todo: Todo): boolean => todo.priority === PRIORITY_VALUES.MEDIUM

export const isLowPriority = (todo: Todo): boolean => todo.priority === PRIORITY_VALUES.LOW

export const equals =
  (a: Todo) =>
  (b: Todo): boolean =>
    TodoId.equals(a.id)(b.id)

export const toJSON = (todo: Todo) => ({
  id: TodoId.toString(todo.id),
  title: todo.title,
  description: todo.description,
  status: todo.status,
  priority: todo.priority,
  createdAt: new Date(todo.createdAt).toISOString(),
  updatedAt: new Date(todo.updatedAt).toISOString(),
  dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : undefined
})
