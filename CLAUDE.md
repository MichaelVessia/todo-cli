# Claude Development Notes

## Quality Assurance
Always run `bun check` after making any code changes to ensure:
- Code passes linting (Biome)
- Code is properly formatted (Biome)  
- All tests pass with type checking

This should be done before committing any changes.

## Testing CLI Commands
When testing the todo CLI tool, always use the non-interactive CLI arguments format instead of the interactive prompts. This ensures faster testing and better verification of functionality. Examples:

### Add Todo
```bash
bun src/bin.ts add --title "My Task" --description "Task description" --priority high --due-date "2024-12-31"
```

### List Todos
```bash
bun src/bin.ts list
```

### Update Todo
```bash
bun src/bin.ts update --id "todo-id" --title "Updated Title" --priority medium
```

### Remove Todos
```bash
bun src/bin.ts remove --id "todo-id1" --id "todo-id2"
```

### Complete Todos
```bash
bun src/bin.ts complete --id "todo-id1" --id "todo-id2"
```

### Switch Database
```bash
bun src/bin.ts switch --provider json --file-path "./todos.json"
```

### Sync Databases
```bash
bun src/bin.ts sync --target-provider markdown --target-path "./todos.md"
```

Note: All commands also support interactive mode when arguments are omitted.

## Scripts
- `bun check` - Run linting, formatting, and tests
- `bun run lint` - Check code with Biome
- `bun run lint-fix` - Fix issues with Biome
- `bun run format` - Format code with Biome
- `bun test` - Run tests
- `bun run build` - Build the project