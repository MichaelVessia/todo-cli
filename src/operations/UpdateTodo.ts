import { Effect } from "effect"
import type { Todo } from "../domain/todo/Todo.js"
import { TodoValidationError } from "../domain/todo/TodoErrors.js"
import type { TodoId } from "../domain/todo/TodoId.js"
import { TodoRepository } from "../domain/todo/TodoRepository.js"
import type { Mutable } from "../shared/types.js"

export interface UpdateTodoCommand {
  readonly id: TodoId
  readonly changes: Partial<Mutable<Pick<Todo, "title" | "description" | "priority" | "dueDate" | "status">>>
}

export const updateTodo = (command: UpdateTodoCommand) =>
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
