import { Config, Schema } from "effect"

export const DataProviderType = Schema.Literal("json", "memory", "markdown")
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

export const MarkdownProviderConfig = Schema.Struct({
  type: Schema.Literal("markdown"),
  filePath: Schema.optional(Schema.String)
})
export type MarkdownProviderConfig = Schema.Schema.Type<typeof MarkdownProviderConfig>

export const DataProviderConfig = Schema.Union(JsonProviderConfig, MemoryProviderConfig, MarkdownProviderConfig)
export type DataProviderConfig = Schema.Schema.Type<typeof DataProviderConfig>

export const DEFAULT_PROVIDER_CONFIG: DataProviderConfig = {
  type: "markdown"
}

export const loadDataProviderConfig = Config.map(
  Config.all({
    providerType: Config.withDefault(
      Config.string("TODO_PROVIDER_TYPE").pipe(
        Config.validate({
          message: "Invalid provider type",
          validation: (value: string): value is DataProviderType =>
            value === "json" || value === "memory" || value === "markdown"
        })
      ),
      "markdown" as const
    ),
    jsonFilePath: Config.option(Config.string("TODO_JSON_FILE_PATH")),
    markdownFilePath: Config.option(Config.string("TODO_MARKDOWN_FILE_PATH"))
  }),
  ({ providerType, jsonFilePath, markdownFilePath }): DataProviderConfig => {
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
      case "markdown":
        return {
          type: "markdown",
          filePath: markdownFilePath._tag === "Some" ? markdownFilePath.value : undefined
        }
    }
  }
)
