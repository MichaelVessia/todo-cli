import { Effect } from "effect"
import { TodoValidationError } from "../domain/todo/TodoErrors.js"
import type { TodoId } from "../domain/todo/TodoId.js"
import { TodoRepository } from "../domain/todo/TodoRepository.js"

export interface RemoveTodosCommand {
  readonly ids: TodoId[]
}

export const removeTodos = (command: RemoveTodosCommand) =>
  Effect.gen(function* () {
    if (command.ids.length === 0) {
      return yield* Effect.fail(
        new TodoValidationError({
          field: "ids",
          reason: "At least one ID must be provided"
        })
      )
    }

    const repository = yield* TodoRepository

    yield* Effect.forEach(command.ids, (id) => repository.deleteById(id))
  })
