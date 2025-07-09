import { describe, expect, test } from "bun:test"
import { MarkdownTodoRepository } from "../../../src/infra/persistence/MarkdownTodoRepository.js"

describe("MarkdownTodoRepository", () => {
  test("should be defined", () => {
    const repository = new MarkdownTodoRepository("/test/path")
    expect(repository).toBeDefined()
  })

  test("should create with file path", () => {
    const filePath = "/test/todos.md"
    const repository = new MarkdownTodoRepository(filePath)
    expect(repository).toBeInstanceOf(MarkdownTodoRepository)
  })
})