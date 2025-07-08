import { Effect } from "effect";
import { TodoValidationError } from "../../domain/todo/TodoErrors.js";
import { TodoId } from "../../domain/todo/TodoId.js";
import { TodoRepository } from "../../domain/todo/TodoRepository.js";

export interface UpdateTodoCommand {
  readonly id: TodoId;
  readonly changes: {
    readonly title?: string
    readonly description?: string
    readonly priority?: "low" | "medium" | "high"
    readonly dueDate?: Date
  }
}


export const updateTodo = (
  command: UpdateTodoCommand
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

    const existingTodo = yield* repository.findById(command.id)

    const updatedTodo = yield* repository.update({ ...existingTodo, ...command.changes })

    return updatedTodo
  })
