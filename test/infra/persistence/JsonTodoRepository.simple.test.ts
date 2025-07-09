import { describe, expect, test } from "bun:test"
import { JsonTodoRepository } from "../../../src/infra/persistence/JsonTodoRepository.js"

describe("JsonTodoRepository", () => {
  test("should be defined", () => {
    const repository = new JsonTodoRepository("/test/path")
    expect(repository).toBeDefined()
  })

  test("should create with file path", () => {
    const filePath = "/test/todos.json"
    const repository = new JsonTodoRepository(filePath)
    expect(repository).toBeInstanceOf(JsonTodoRepository)
  })
})