import { Schema } from "@effect/schema"
import { Data } from "effect"
import { DEFAULT_PRIORITY, PRIORITY_VALUES } from "./PriorityConstants.js"
import { TodoId, TodoIdSchema } from "./TodoId.js"

export const TodoStatus = Schema.Literal("pending", "completed", "in_progress")
export type TodoStatus = Schema.Schema.Type<typeof TodoStatus>

export const TodoPriority = Schema.Literal("low", "medium", "high")
export type TodoPriority = Schema.Schema.Type<typeof TodoPriority>

export const TodoSchema = Schema.Struct({
  id: TodoIdSchema,
  title: Schema.String.pipe(Schema.nonEmptyString()),
  description: Schema.optional(Schema.String),
  status: TodoStatus,
  priority: TodoPriority,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
  dueDate: Schema.optional(Schema.DateTimeUtc)
})

export class Todo extends Data.Class<{
  readonly id: TodoId
  readonly title: string
  readonly description?: string
  readonly status: TodoStatus
  readonly priority: TodoPriority
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly dueDate?: Date
}> {}

export const makeTodo = (props: {
  title: string
  description?: string
  priority?: TodoPriority
  dueDate?: Date
}): Todo => {
  const now = new Date()
  return new Todo({
    id: TodoId.generate(),
    title: props.title,
    ...(props.description ? { description: props.description } : {}),
    status: "pending" as const,
    priority: props.priority ?? DEFAULT_PRIORITY,
    createdAt: now,
    updatedAt: now,
    ...(props.dueDate ? { dueDate: props.dueDate } : {})
  })
}

export const complete = (todo: Todo): Todo =>
  new Todo({
    ...todo,
    status: "completed",
    updatedAt: new Date()
  })

export const start = (todo: Todo): Todo =>
  new Todo({
    ...todo,
    status: "in_progress",
    updatedAt: new Date()
  })

export const updateTitle =
  (title: string) =>
  (todo: Todo): Todo =>
    new Todo({
      ...todo,
      title,
      updatedAt: new Date()
    })

export const updateDescription =
  (description: string) =>
  (todo: Todo): Todo =>
    new Todo({
      ...todo,
      description,
      updatedAt: new Date()
    })

export const updatePriority =
  (priority: TodoPriority) =>
  (todo: Todo): Todo =>
    new Todo({
      ...todo,
      priority,
      updatedAt: new Date()
    })

export const updateDueDate =
  (dueDate: Date) =>
  (todo: Todo): Todo =>
    new Todo({
      ...todo,
      dueDate,
      updatedAt: new Date()
    })

export const isCompleted = (todo: Todo): boolean => todo.status === "completed"

export const isPending = (todo: Todo): boolean => todo.status === "pending"

export const isInProgress = (todo: Todo): boolean => todo.status === "in_progress"

export const isOverdue = (todo: Todo): boolean =>
  todo.dueDate !== undefined && todo.dueDate < new Date() && !isCompleted(todo)

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
  createdAt: todo.createdAt.toISOString(),
  updatedAt: todo.updatedAt.toISOString(),
  dueDate: todo.dueDate?.toISOString()
})
