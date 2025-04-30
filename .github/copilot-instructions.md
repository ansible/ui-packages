# Project coding standards

## TypeScript Guidelines

- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators

## React Guidelines

- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Prefer `function` components with explicitly typed props (import and use `ReactNode` for children when needed)
- Keep components small and focused
- Use Styled Components for styling

## Naming Conventions

- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with underscore (\_)
- Use ALL_CAPS for constants

## Error Handling

- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information

## Testing Guidelines

- Use [Vitest](https://vitest.dev) for unit and integration tests
- Use [`@testing-library/jest-dom/vitest`](https://testing-library.com/docs/ecosystem-jest-dom/#vitest-setup) for DOM assertions
- Structure tests to mirror the file structure of the source code
- Name test files with `.test.ts` or `.test.tsx` suffix
- Prefer testing behavior over implementation details
- Use `describe`, `it`, and `expect` for organizing and asserting tests
- Use `screen` and `userEvent` from `@testing-library/react` for UI interaction
- Clean up side effects with `beforeEach`/`afterEach` where appropriate
- Mock external dependencies with Vitest’s mocking utilities (`vi.mock`)
- Use `vi.fn` over `jest.fn`