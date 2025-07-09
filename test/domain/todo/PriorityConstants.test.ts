import { describe, expect, test } from "bun:test"
import { 
  DEFAULT_PRIORITY, 
  PRIORITY_VALUES 
} from "../../../src/domain/todo/PriorityConstants.js"

describe("PriorityConstants", () => {
  describe("PRIORITY_VALUES", () => {
    test("should have all priority values", () => {
      expect(PRIORITY_VALUES.LOW).toBe("low")
      expect(PRIORITY_VALUES.MEDIUM).toBe("medium")
      expect(PRIORITY_VALUES.HIGH).toBe("high")
    })

    test("should be readonly object", () => {
      expect(typeof PRIORITY_VALUES).toBe("object")
      expect(PRIORITY_VALUES).toBeDefined()
    })

    test("should have exactly 3 priority values", () => {
      const keys = Object.keys(PRIORITY_VALUES)
      expect(keys).toHaveLength(3)
      expect(keys).toContain("LOW")
      expect(keys).toContain("MEDIUM")
      expect(keys).toContain("HIGH")
    })
  })

  describe("DEFAULT_PRIORITY", () => {
    test("should be medium priority", () => {
      expect(DEFAULT_PRIORITY).toBe("medium")
      expect(DEFAULT_PRIORITY).toBe(PRIORITY_VALUES.MEDIUM)
    })

    test("should be one of the valid priority values", () => {
      const validPriorities = Object.values(PRIORITY_VALUES)
      expect(validPriorities).toContain(DEFAULT_PRIORITY)
    })
  })
})