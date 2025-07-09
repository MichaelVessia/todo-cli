import { describe, expect, test } from "bun:test"
import { TodoId } from "../../../src/domain/todo/TodoId.js"

describe("TodoId", () => {
  describe("generate", () => {
    test("should generate a valid TodoId", () => {
      const id = TodoId.generate()
      expect(id).toBeDefined()
      expect(typeof TodoId.toString(id)).toBe("string")
    })

    test("should generate unique IDs", () => {
      const id1 = TodoId.generate()
      const id2 = TodoId.generate()
      expect(TodoId.equals(id1)(id2)).toBe(false)
    })
  })

  describe("make", () => {
    test("should create TodoId from valid string", () => {
      const originalId = TodoId.generate()
      const idString = TodoId.toString(originalId)
      const recreatedId = TodoId.make(idString)

      expect(TodoId.equals(originalId)(recreatedId)).toBe(true)
    })

    test("should handle valid alphanumeric format", () => {
      const validId = "abc123def456"
      const id = TodoId.make(validId)
      expect(TodoId.toString(id)).toBe(validId)
    })
  })

  describe("toString", () => {
    test("should convert TodoId to string", () => {
      const id = TodoId.generate()
      const idString = TodoId.toString(id)
      expect(typeof idString).toBe("string")
      expect(idString.length).toBeGreaterThan(0)
    })
  })

  describe("equals", () => {
    test("should return true for same TodoId", () => {
      const id = TodoId.generate()
      expect(TodoId.equals(id)(id)).toBe(true)
    })

    test("should return false for different TodoIds", () => {
      const id1 = TodoId.generate()
      const id2 = TodoId.generate()
      expect(TodoId.equals(id1)(id2)).toBe(false)
    })

    test("should return true for TodoIds created from same string", () => {
      const idString = "abc123def456"
      const id1 = TodoId.make(idString)
      const id2 = TodoId.make(idString)
      expect(TodoId.equals(id1)(id2)).toBe(true)
    })
  })
})