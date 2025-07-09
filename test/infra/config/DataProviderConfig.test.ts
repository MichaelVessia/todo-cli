import { describe, expect, test } from "bun:test"
import { ConfigProvider, Effect } from "effect"
import { 
  loadDataProviderConfig, 
  DEFAULT_PROVIDER_CONFIG,
  type DataProviderConfig 
} from "../../../src/infra/config/DataProviderConfig.js"

describe("DataProviderConfig", () => {
  describe("loadDataProviderConfig", () => {
    test("should return default markdown provider when no environment variables are set", async () => {
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(new Map()))
        )
      )
      
      expect(config).toEqual(DEFAULT_PROVIDER_CONFIG)
      expect(config.type).toBe("markdown")
    })

    test("should load JSON provider config from environment", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "json"],
        ["TODO_JSON_FILE_PATH", "/custom/path/todos.json"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("json")
      if (config.type === "json") {
        expect(config.filePath).toBe("/custom/path/todos.json")
      }
    })

    test("should load memory provider config from environment", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "memory"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("memory")
    })

    test("should load markdown provider config from environment", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "markdown"],
        ["TODO_MARKDOWN_FILE_PATH", "/custom/path/todos.md"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("markdown")
      if (config.type === "markdown") {
        expect(config.filePath).toBe("/custom/path/todos.md")
      }
    })

    test("should load markdown provider config with default file path", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "markdown"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("markdown")
      if (config.type === "markdown") {
        expect(config.filePath).toBeUndefined()
      }
    })

    test("should fall back to default config on invalid provider type", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "invalid"]
      ])
      
      await expect(
        Effect.runPromise(
          loadDataProviderConfig.pipe(
            Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
          )
        )
      ).rejects.toThrow()
    })
  })
})