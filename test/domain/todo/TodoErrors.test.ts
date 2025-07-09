import { describe, expect, test } from "bun:test"
import { 
  TodoAlreadyExistsError,
  TodoNotFoundError,
  TodoRepositoryError,
  TodoValidationError 
} from "../../../src/domain/todo/TodoErrors.js"
import { TodoId } from "../../../src/domain/todo/TodoId.js"

describe("TodoErrors", () => {
  describe("TodoAlreadyExistsError", () => {
    test("should create error with TodoId", () => {
      const id = TodoId.generate()
      const error = new TodoAlreadyExistsError({ id })

      expect(error).toBeInstanceOf(TodoAlreadyExistsError)
      expect(error.message).toContain("already exists")
      expect(error.id).toEqual(id)
    })

    test("should be instance of Error", () => {
      const id = TodoId.generate()
      const error = new TodoAlreadyExistsError({ id })

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe("TodoNotFoundError", () => {
    test("should create error with TodoId", () => {
      const id = TodoId.generate()
      const error = new TodoNotFoundError({ id })

      expect(error).toBeInstanceOf(TodoNotFoundError)
      expect(error.message).toContain("not found")
      expect(error.id).toEqual(id)
    })

    test("should be instance of Error", () => {
      const id = TodoId.generate()
      const error = new TodoNotFoundError({ id })

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe("TodoRepositoryError", () => {
    test("should create error with cause", () => {
      const cause = new Error("Database connection failed")
      const error = new TodoRepositoryError({ cause })

      expect(error).toBeInstanceOf(TodoRepositoryError)
      expect(error.message).toContain("repository")
    })

    test("should create error without cause", () => {
      const error = new TodoRepositoryError({})

      expect(error).toBeInstanceOf(TodoRepositoryError)
      expect(error.message).toContain("repository")
    })

    test("should be instance of Error", () => {
      const error = new TodoRepositoryError({})

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe("TodoValidationError", () => {
    test("should create error with field and reason", () => {
      const error = new TodoValidationError({
        field: "title",
        reason: "Title cannot be empty"
      })

      expect(error).toBeInstanceOf(TodoValidationError)
      expect(error.message).toContain("validation")
    })

    test("should create error with different field and reason", () => {
      const error = new TodoValidationError({
        field: "priority",
        reason: "Priority must be low, medium, or high"
      })

      expect(error).toBeInstanceOf(TodoValidationError)
    })

    test("should be instance of Error", () => {
      const error = new TodoValidationError({
        field: "title",
        reason: "Title cannot be empty"
      })

      expect(error).toBeInstanceOf(Error)
    })
  })
})