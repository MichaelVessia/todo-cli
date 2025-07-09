import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { BunContext } from "@effect/platform-bun"
import { Effect } from "effect"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { ConfigManager } from "../../src/infra/config/ConfigManager.js"
import type { DataProviderConfig } from "../../src/infra/config/DataProviderConfig.js"
import { switchDatabase } from "../../src/operations/SwitchDatabase.js"

const TEST_CONFIG_DIR = path.join(os.tmpdir(), "test-todo-cli-switch-db")
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, "config.json")

describe("SwitchDatabase", () => {
  let testConfigManager: ConfigManager

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true })
    }

    // Create test config manager
    testConfigManager = new ConfigManager(TEST_CONFIG_FILE)
  })

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true })
    }
  })

  test("should switch to JSON database", async () => {
    const config: DataProviderConfig = {
      type: "json",
      filePath: "/custom/path/todos.json"
    }

    // Execute the switch
    await Effect.runPromise(
      switchDatabase(config, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the configuration was saved
    const savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(savedConfig).toEqual(config)
  })

  test("should switch to Markdown database", async () => {
    const config: DataProviderConfig = {
      type: "markdown",
      filePath: "/custom/path/todos.md"
    }

    // Execute the switch
    await Effect.runPromise(
      switchDatabase(config, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the configuration was saved
    const savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(savedConfig).toEqual(config)
  })

  test("should switch to Memory database", async () => {
    const config: DataProviderConfig = {
      type: "memory"
    }

    // Execute the switch
    await Effect.runPromise(
      switchDatabase(config, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the configuration was saved
    const savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(savedConfig).toEqual(config)
  })

  test("should switch to JSON database without custom path", async () => {
    const config: DataProviderConfig = {
      type: "json"
    }

    // Execute the switch
    await Effect.runPromise(
      switchDatabase(config, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the configuration was saved
    const savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(savedConfig).toEqual(config)
  })

  test("should switch to Markdown database without custom path", async () => {
    const config: DataProviderConfig = {
      type: "markdown"
    }

    // Execute the switch
    await Effect.runPromise(
      switchDatabase(config, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    // Verify the configuration was saved
    const savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )

    expect(savedConfig).toEqual(config)
  })

  test("should handle switching between different database types", async () => {
    // Start with JSON
    const jsonConfig: DataProviderConfig = { type: "json" }
    await Effect.runPromise(
      switchDatabase(jsonConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    let savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )
    expect(savedConfig).toEqual(jsonConfig)

    // Switch to Markdown
    const markdownConfig: DataProviderConfig = { type: "markdown" }
    await Effect.runPromise(
      switchDatabase(markdownConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )
    expect(savedConfig).toEqual(markdownConfig)

    // Switch to Memory
    const memoryConfig: DataProviderConfig = { type: "memory" }
    await Effect.runPromise(
      switchDatabase(memoryConfig, testConfigManager).pipe(Effect.provide(BunContext.layer))
    )

    savedConfig = await Effect.runPromise(
      testConfigManager.getDataProviderConfig().pipe(Effect.provide(BunContext.layer))
    )
    expect(savedConfig).toEqual(memoryConfig)
  })
})