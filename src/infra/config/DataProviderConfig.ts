import { Config, Schema } from "effect"

export const DataProviderType = Schema.Literal("json", "memory", "sqlite", "postgres")
export type DataProviderType = Schema.Schema.Type<typeof DataProviderType>

export const JsonProviderConfig = Schema.Struct({
  type: Schema.Literal("json"),
  filePath: Schema.optional(Schema.String)
})
export type JsonProviderConfig = Schema.Schema.Type<typeof JsonProviderConfig>

export const MemoryProviderConfig = Schema.Struct({
  type: Schema.Literal("memory")
})
export type MemoryProviderConfig = Schema.Schema.Type<typeof MemoryProviderConfig>

export const SqliteProviderConfig = Schema.Struct({
  type: Schema.Literal("sqlite"),
  databasePath: Schema.String
})
export type SqliteProviderConfig = Schema.Schema.Type<typeof SqliteProviderConfig>

export const PostgresProviderConfig = Schema.Struct({
  type: Schema.Literal("postgres"),
  connectionString: Schema.String
})
export type PostgresProviderConfig = Schema.Schema.Type<typeof PostgresProviderConfig>

export const DataProviderConfig = Schema.Union(
  JsonProviderConfig,
  MemoryProviderConfig,
  SqliteProviderConfig,
  PostgresProviderConfig
)
export type DataProviderConfig = Schema.Schema.Type<typeof DataProviderConfig>

export const DEFAULT_PROVIDER_CONFIG: DataProviderConfig = {
  type: "json"
}

export const loadDataProviderConfig = Config.map(
  Config.all({
    providerType: Config.withDefault(
      Config.string("TODO_PROVIDER_TYPE").pipe(
        Config.validate({
          message: "Invalid provider type",
          validation: (value: string): value is DataProviderType =>
            value === "json" || value === "memory" || value === "sqlite" || value === "postgres"
        })
      ),
      "json" as const
    ),
    jsonFilePath: Config.option(Config.string("TODO_JSON_FILE_PATH")),
    sqliteDatabasePath: Config.option(Config.string("TODO_SQLITE_DATABASE_PATH")),
    postgresConnectionString: Config.option(Config.string("TODO_POSTGRES_CONNECTION_STRING"))
  }),
  ({ providerType, jsonFilePath, sqliteDatabasePath, postgresConnectionString }): DataProviderConfig => {
    switch (providerType) {
      case "json":
        return {
          type: "json",
          filePath: jsonFilePath._tag === "Some" ? jsonFilePath.value : undefined
        }
      case "memory":
        return {
          type: "memory"
        }
      case "sqlite":
        if (sqliteDatabasePath._tag === "None") {
          throw new Error("TODO_SQLITE_DATABASE_PATH must be set when using sqlite provider")
        }
        return {
          type: "sqlite",
          databasePath: sqliteDatabasePath.value
        }
      case "postgres":
        if (postgresConnectionString._tag === "None") {
          throw new Error("TODO_POSTGRES_CONNECTION_STRING must be set when using postgres provider")
        }
        return {
          type: "postgres",
          connectionString: postgresConnectionString.value
        }
    }
  }
)
