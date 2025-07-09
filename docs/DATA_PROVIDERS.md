# Todo CLI Data Providers

The Todo CLI now supports pluggable data providers, allowing you to choose how and where your todos are stored.

## Available Providers

### JSON (Default)
Stores todos in a JSON file on your local filesystem.

**Configuration:**
```bash
# Use default location (~/.todo-cli/todos.json)
export TODO_PROVIDER_TYPE=json

# Or specify custom file path
export TODO_PROVIDER_TYPE=json
export TODO_JSON_FILE_PATH=/path/to/your/todos.json
```

### Memory
Stores todos in memory. Data is lost when the application exits. Useful for testing or temporary sessions.

**Configuration:**
```bash
export TODO_PROVIDER_TYPE=memory
```

### SQLite (Coming Soon)
Will store todos in a SQLite database file.

**Configuration:**
```bash
export TODO_PROVIDER_TYPE=sqlite
export TODO_SQLITE_DATABASE_PATH=/path/to/todos.db  # Optional, defaults to ~/.todo-cli/todos.db
```

### PostgreSQL (Coming Soon)
Will store todos in a PostgreSQL database.

**Configuration:**
```bash
export TODO_PROVIDER_TYPE=postgres
export TODO_POSTGRES_CONNECTION_STRING=postgresql://user:password@localhost:5432/todos
```

## Usage Examples

### Using the default JSON provider
```bash
# No configuration needed, just run the CLI
bun run todo
```

### Using memory provider for testing
```bash
# Set the provider type
export TODO_PROVIDER_TYPE=memory

# Run the CLI - todos will only exist during this session
bun run todo add
```

### Using a custom JSON file location
```bash
export TODO_PROVIDER_TYPE=json
export TODO_JSON_FILE_PATH=~/Documents/my-todos.json

bun run todo list
```

## Architecture

The data provider system uses the Repository pattern with dependency injection via Effect's Layer system:

1. **TodoRepository Interface**: Defines the contract that all providers must implement
2. **Provider Implementations**: Each provider (JSON, Memory, etc.) implements the TodoRepository interface
3. **Configuration System**: Reads environment variables to determine which provider to use
4. **Layer Composition**: The TodoRepositoryLayer selects and instantiates the appropriate provider based on configuration

This architecture ensures:
- Clean separation of concerns
- Easy addition of new providers
- No changes required to business logic when switching providers
- Type-safe configuration

## Adding New Providers

To add a new data provider:

1. Create a new class implementing the `TodoRepository` interface
2. Add the provider type to `DataProviderConfig`
3. Update the `createRepository` function in `TodoRepositoryLayer`
4. Add configuration parsing for any provider-specific settings

Example provider implementation can be found in:
- `/src/infra/persistence/JsonTodoRepository.ts`
- `/src/infra/persistence/MemoryTodoRepository.ts`