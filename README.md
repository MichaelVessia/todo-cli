# Todo CLI

A modern command-line todo application built with TypeScript and Effect, featuring both interactive and direct command modes.

## Features

- **Interactive Mode**: Menu-driven interface for all operations
- **Direct Commands**: Support for `add`, `list`, `update`, `remove`, and `complete` subcommands
- **Priority Management**: Three priority levels (low, medium, high)
- **Status Tracking**: Pending, in-progress, and completed status states
- **Due Dates**: Optional due date support with overdue detection
- **Bulk Operations**: Multi-select for removing and completing multiple todos
- **Data Persistence**: SQLite database for reliable local storage
- **Schema Validation**: Runtime validation using Effect Schema
- **Error Handling**: Comprehensive error handling with custom error types

## Installation

```bash
npm install -g @michaelvessia/todo-cli
```

## Usage

### Interactive Mode

Launch the interactive menu:

```bash
todo-cli
```

This presents a menu with options:
- Add a new todo
- List all todos
- Update a todo
- Remove todos
- Complete a todo

### Direct Commands

```bash
todo-cli add      # Add new todo
todo-cli list     # List all todos
todo-cli update   # Update existing todo
todo-cli remove   # Remove todos
todo-cli complete # Complete todos
```

## Data Storage

The application uses SQLite for data persistence, providing reliable local storage with ACID compliance.

### Database Location

By default, the SQLite database is stored at `~/.todo-cli/todos.db`.

### Configuration

You can customize the database location using an environment variable:

```bash
# Use custom database path
export TODO_DB_PATH=/path/to/todos.db
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) runtime

### Installation

```bash
git clone https://github.com/MichaelVessia/todo-cli.git
cd todo-cli
bun install
```

### Scripts

```bash
bun run build    # Build the project
bun test         # Run tests
bun run check    # Run linting, formatting, and tests
bun run lint     # Check code with Biome
bun run lint-fix # Fix issues with Biome
bun run format   # Format code with Biome
bun run coverage # Run tests with coverage
```

### Quality Assurance

Always run `bun check` after making any code changes to ensure:
- Code passes linting (Biome)
- Code is properly formatted (Biome)
- All tests pass with type checking

This should be done before committing any changes.

### Architecture

The application follows a clean architecture pattern:

- **Domain Layer** (`src/domain/`): Core entities, repository interfaces, and business logic
- **Infrastructure Layer** (`src/infra/`): SQLite persistence implementation
- **Operations Layer** (`src/operations/`): Business operations and use cases
- **CLI Layer** (`src/cli/`): User interface and command handling

### Technical Stack

- **Runtime**: Bun
- **Framework**: Effect (functional programming library)
- **CLI Framework**: @effect/cli
- **Schema Validation**: @effect/schema
- **File System**: @effect/platform with Bun integration
- **Testing**: Bun test runner
- **Linting/Formatting**: Biome

## Contributing

### Changelog Process

This project uses [Changesets](https://github.com/changesets/changesets) for automated changelog generation and version management.

#### How it works:

1. **Manual process**: Developers need to run `changeset add` to create changeset files
2. **Version updates**: Run `changeset version` to update CHANGELOG.md and bump versions
3. **No automation**: GitHub Actions don't automatically generate changelogs on push

#### To contribute with changelog updates:

1. Make your changes
2. Run `changeset add` to create a changeset describing your changes
3. Commit both your changes and the changeset file
4. The changelog will be updated when maintainers run `changeset version`

The changelog won't update automatically just from pushing code changes without corresponding changeset files.

### Development Scripts

```bash
bun changeset-version  # Update version and changelog
bun changeset-publish  # Build and test for publishing
```

## License

MIT

## Repository

[https://github.com/MichaelVessia/todo-cli](https://github.com/MichaelVessia/todo-cli)