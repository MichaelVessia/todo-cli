import { Schema } from "@effect/schema"
import { Brand } from "effect"

const TodoIdBrand = Symbol.for("TodoId")

export const TodoIdSchema = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.pattern(/^[a-zA-Z0-9]{8,}$/),
  Schema.annotations({
    identifier: "TodoId",
    title: "Todo ID",
    description: "A unique identifier for a Todo item",
    examples: ["abc12345", "xyz98765"]
  }),
  Schema.brand(TodoIdBrand)
)

export type TodoId = Schema.Schema.Type<typeof TodoIdSchema>

export const TodoId = {
  make: (value: string): TodoId => Schema.decodeSync(TodoIdSchema)(value),

  makeOption: Schema.decodeOption(TodoIdSchema),

  makeEither: Schema.decodeEither(TodoIdSchema),

  is: Schema.is(TodoIdSchema),

  generate: (): TodoId => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 12; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return TodoId.make(id)
  },

  equals: (a: TodoId) => (b: TodoId): boolean => a === b,

  toString: (id: TodoId): string => Brand.nominal<TodoId>()(id)
}
