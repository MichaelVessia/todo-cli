import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { BunContext } from "@effect/platform-bun"
import { Effect } from "effect"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { ConfigManager } from "../../../src/infra/config/ConfigManager.js"
import type { DataProviderConfig } from "../../../src/infra/config/DataProviderConfig.js"

const TEST_CONFIG_DIR = path.join(os.tmpdir(), "test-todo-cli-config")
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, "config.json")

// Create a test config manager that uses a test directory
const createTestConfigManager = () => {
  return new ConfigManager(TEST_CONFIG_FILE)
}

describe("ConfigManager", () => {
  let configManager: ConfigManager

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true })
    }

    configManager = createTestConfigManager()
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true })
    }
  })

  test("should return default config when no config file exists", async () => {
    const result = await Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(result).toEqual({
      type: "markdown"
    })
  })

  test("should save and load json provider config", async () => {
    const config: DataProviderConfig = {
      type: "json",
      filePath: "/custom/path/todos.json"
    }

    await Effect.runPromise(
      configManager.setDataProviderConfig(config).pipe(Effect.provide(BunContext.layer))
    )

    const result = await Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(result).toEqual(config)
  })

  test("should save and load markdown provider config", async () => {
    const config: DataProviderConfig = {
      type: "markdown",
      filePath: "/custom/path/todos.md"
    }

    await Effect.runPromise(
      configManager.setDataProviderConfig(config).pipe(Effect.provide(BunContext.layer))
    )

    const result = await Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(result).toEqual(config)
  })

  test("should save and load memory provider config", async () => {
    const config: DataProviderConfig = {
      type: "memory"
    }

    await Effect.runPromise(
      configManager.setDataProviderConfig(config).pipe(Effect.provide(BunContext.layer))
    )

    const result = await Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(result).toEqual(config)
  })

  test("should create config directory if it doesn't exist", async () => {
    const config: DataProviderConfig = {
      type: "json"
    }

    await Effect.runPromise(
      configManager.setDataProviderConfig(config).pipe(Effect.provide(BunContext.layer))
    )

    expect(fs.existsSync(TEST_CONFIG_DIR)).toBe(true)
    expect(fs.existsSync(TEST_CONFIG_FILE)).toBe(true)
  })

  test("should handle empty config file gracefully", async () => {
    // Create directory and empty file
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true })
    fs.writeFileSync(TEST_CONFIG_FILE, "")

    const result = await Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(result).toEqual({
      type: "markdown"
    })
  })

  test("should handle invalid JSON gracefully", async () => {
    // Create directory and invalid JSON file
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true })
    fs.writeFileSync(TEST_CONFIG_FILE, "invalid json")

    const result = Effect.runPromise(
      configManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    await expect(result).rejects.toThrow()
  })
})