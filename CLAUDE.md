# Claude Development Notes

## Quality Assurance
Always run `bun check` after making any code changes to ensure:
- Code passes linting (Biome)
- Code is properly formatted (Biome)  
- All tests pass with type checking

This should be done before committing any changes.

## Scripts
- `bun check` - Run linting, formatting, and tests
- `bun run lint` - Check code with Biome
- `bun run lint-fix` - Fix issues with Biome
- `bun run format` - Format code with Biome
- `bun test` - Run tests
- `bun run build` - Build the project