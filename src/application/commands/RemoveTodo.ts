import { Effect } from "effect";
import { TodoValidationError } from "../../domain/todo/TodoErrors.js";
import { TodoId } from "../../domain/todo/TodoId.js";
import { TodoRepository } from "../../domain/todo/TodoRepository.js";

export interface RemoveTodoCommand {
  readonly id: TodoId;
}

export const removeTodo = (
  command: RemoveTodoCommand
) =>
  Effect.gen(function* () {
    if (!command.id.trim()) {
      return yield* Effect.fail(
        new TodoValidationError({
          field: "id",
          reason: "ID cannot be empty"
        })
      )
    }

    const repository = yield* TodoRepository

    yield* repository.deleteById(command.id)
  })
