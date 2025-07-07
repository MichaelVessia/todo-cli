import { Data } from "effect"
import type { TodoId } from "./TodoId.js"

export class TodoNotFoundError extends Data.TaggedError("TodoNotFoundError")<{
  readonly id: TodoId
}> {
  get message() {
    return `Todo with id ${this.id} not found`
  }
}

export class TodoAlreadyExistsError extends Data.TaggedError("TodoAlreadyExistsError")<{
  readonly id: TodoId
}> {
  get message() {
    return `Todo with id ${this.id} already exists`
  }
}

export class TodoValidationError extends Data.TaggedError("TodoValidationError")<{
  readonly field: string
  readonly reason: string
}> {
  get message() {
    return `Todo validation failed for field '${this.field}': ${this.reason}`
  }
}

export class TodoRepositoryError extends Data.TaggedError("TodoRepositoryError")<{
  readonly cause: unknown
}> {
  get message() {
    return `Todo repository operation failed: ${this.cause}`
  }
}

export class TodoStateError extends Data.TaggedError("TodoStateError")<{
  readonly currentState: string
  readonly attemptedTransition: string
}> {
  get message() {
    return `Invalid todo state transition from '${this.currentState}' to '${this.attemptedTransition}'`
  }
}

export type TodoError =
  | TodoNotFoundError
  | TodoAlreadyExistsError
  | TodoValidationError
  | TodoRepositoryError
  | TodoStateError
