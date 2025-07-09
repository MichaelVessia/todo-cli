import { Console, Effect } from "effect"
import { type ConfigManager, configManager } from "../infra/config/ConfigManager.js"
import type { DataProviderConfig } from "../infra/config/DataProviderConfig.js"

export const switchDatabase = (
  config: DataProviderConfig,
  manager: ConfigManager = configManager
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    yield* manager.setDataProviderConfig(config)

    const providerName = config.type === "json" ? "JSON" : config.type === "markdown" ? "Markdown" : "Memory"

    const filePath = "filePath" in config && config.filePath ? ` (${config.filePath})` : ""

    yield* Console.log(`Database switched to ${providerName}${filePath}`)
  }).pipe(Effect.catchAll((error) => Console.log(`Error switching database: ${error.message}`)))
