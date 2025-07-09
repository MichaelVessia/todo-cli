import * as os from "node:os"
import * as path from "node:path"
import { FileSystem } from "@effect/platform"
import { BunFileSystem } from "@effect/platform-bun"
import { Schema } from "@effect/schema"
import { Effect } from "effect"
import { TodoRepositoryError } from "../../domain/todo/TodoErrors.js"
import { type DataProviderConfig, DataProviderConfig as DataProviderConfigSchema } from "./DataProviderConfig.js"

const CONFIG_DIR = path.join(os.homedir(), ".todo-cli")
const CONFIG_FILE_PATH = path.join(CONFIG_DIR, "config.json")

const ConfigFileSchema = Schema.Struct({
  dataProvider: DataProviderConfigSchema
})

type ConfigFile = Schema.Schema.Type<typeof ConfigFileSchema>

export class ConfigManager {
  constructor(private readonly configFilePath: string = CONFIG_FILE_PATH) {}

  private readonly readConfig = (): Effect.Effect<ConfigFile | null, TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const fs = yield* FileSystem.FileSystem

        const fileExists = yield* fs
          .exists(this.configFilePath)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        if (!fileExists) {
          return null
        }

        const content = yield* fs
          .readFileString(this.configFilePath)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        if (!content.trim()) {
          return null
        }

        try {
          const parsed = JSON.parse(content)
          const decoded = yield* Schema.decodeUnknown(ConfigFileSchema)(parsed).pipe(
            Effect.mapError((error) => new TodoRepositoryError({ cause: error }))
          )
          return decoded
        } catch (error) {
          return yield* Effect.fail(new TodoRepositoryError({ cause: error }))
        }
      }.bind(this)
    ).pipe(Effect.provide(BunFileSystem.layer))

  private readonly writeConfig = (config: ConfigFile): Effect.Effect<void, TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const fs = yield* FileSystem.FileSystem

        // Ensure directory exists
        const configDir = path.dirname(this.configFilePath)
        const dirExists = yield* fs
          .exists(configDir)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))

        if (!dirExists) {
          yield* fs
            .makeDirectory(configDir, { recursive: true })
            .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
        }

        const content = JSON.stringify(config, null, 2)
        yield* fs
          .writeFileString(this.configFilePath, content)
          .pipe(Effect.mapError((error) => new TodoRepositoryError({ cause: error })))
      }.bind(this)
    ).pipe(Effect.provide(BunFileSystem.layer))

  readonly getDataProviderConfig = (): Effect.Effect<DataProviderConfig, TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const config = yield* this.readConfig()

        if (config) {
          return config.dataProvider
        }

        // Default configuration
        const defaultConfig: DataProviderConfig = {
          type: "markdown"
        }

        return defaultConfig
      }.bind(this)
    )

  readonly setDataProviderConfig = (config: DataProviderConfig): Effect.Effect<void, TodoRepositoryError, never> =>
    Effect.gen(
      function* () {
        const configFile: ConfigFile = {
          dataProvider: config
        }
        yield* this.writeConfig(configFile)
      }.bind(this)
    )

  readonly getConfigFilePath = (): string => this.configFilePath
}

export const configManager = new ConfigManager()
