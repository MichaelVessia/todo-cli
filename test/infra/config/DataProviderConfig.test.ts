import { describe, expect, test } from "bun:test"
import { ConfigProvider, Effect } from "effect"
import { 
  loadDataProviderConfig, 
  DEFAULT_PROVIDER_CONFIG,
  type DataProviderConfig 
} from "../../../src/infra/config/DataProviderConfig.js"

describe("DataProviderConfig", () => {
  describe("loadDataProviderConfig", () => {
    test("should return default JSON provider when no environment variables are set", async () => {
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(new Map()))
        )
      )
      
      expect(config).toEqual(DEFAULT_PROVIDER_CONFIG)
      expect(config.type).toBe("json")
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

    test("should load SQLite provider config from environment", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "sqlite"],
        ["TODO_SQLITE_DATABASE_PATH", "/custom/path/todos.db"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("sqlite")
      if (config.type === "sqlite") {
        expect(config.databasePath).toBe("/custom/path/todos.db")
      }
    })

    test("should throw error when SQLite provider type is set but no database path", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "sqlite"]
      ])
      
      await expect(
        Effect.runPromise(
          loadDataProviderConfig.pipe(
            Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
          )
        )
      ).rejects.toThrow("TODO_SQLITE_DATABASE_PATH must be set when using sqlite provider")
    })

    test("should load Postgres provider config from environment", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "postgres"],
        ["TODO_POSTGRES_CONNECTION_STRING", "postgresql://user:pass@localhost/todos"]
      ])
      
      const config = await Effect.runPromise(
        loadDataProviderConfig.pipe(
          Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
        )
      )
      
      expect(config.type).toBe("postgres")
      if (config.type === "postgres") {
        expect(config.connectionString).toBe("postgresql://user:pass@localhost/todos")
      }
    })

    test("should throw error when Postgres provider type is set but no connection string", async () => {
      const envMap = new Map([
        ["TODO_PROVIDER_TYPE", "postgres"]
      ])
      
      await expect(
        Effect.runPromise(
          loadDataProviderConfig.pipe(
            Effect.withConfigProvider(ConfigProvider.fromMap(envMap))
          )
        )
      ).rejects.toThrow("TODO_POSTGRES_CONNECTION_STRING must be set when using postgres provider")
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