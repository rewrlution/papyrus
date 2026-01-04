# CLI Development Documentation

Welcome to the Papyrus CLI development documentation. This collection of guides will help you understand and extend the CLI application.

## 📚 Documentation Index

### Getting Started

#### [Tutor Principles](../../../docs/TUTOR-PRINCIPLES.md) 🎯

**Guidelines for writing technical tutorials and documentation.**

**⚠️ Important:** Read this first if you're writing new tutorials or contributing code. Feed this document to Claude at the start of coding sessions.

Key principles:

- Top-down approach
- Proper componentization
- No unnecessary complexity
- Use popular libraries
- Explain why, not just how
- Complete working code examples

---

### Foundation Tutorials

#### [01 - Storage Layer](./01-STORAGE-LAYER.md)

**Building a cross-platform storage system following XDG standards.**

Learn how to:

- Implement XDG Base Directory specification
- Store config, tokens, and journal entries
- Create platform-agnostic file storage
- Write testable storage classes
- Use popular libraries (env-paths)

Prerequisites: Basic Node.js file I/O knowledge

---

#### [02 - API Client Setup](./02-API-CLIENT-SETUP.md)

**How to set up and use the API client for server communication.**

Learn how to:

- Create an HTTP client with Axios
- Manage authentication tokens
- Define and use API types
- Integrate with the shared package
- Validate with Zod schemas
- Test API calls

Prerequisites: Basic TypeScript and HTTP knowledge

---

#### [03 - React CLI Components](./03-REACT-CLI-COMPONENTS.md)

**Building terminal UIs with React and Ink.**

Learn how to:

- Use React in the terminal
- Build interactive forms
- Handle user input
- Manage component state
- Create reusable components
- Test Ink components

Prerequisites: Basic React knowledge

---

### Feature Implementation Guides

#### [04 - Login Implementation](./04-LOGIN-IMPLEMENTATION.md)

**Complete walkthrough of building a login feature.**

A practical, end-to-end example that combines:

- React components (forms, status messages)
- API integration (authentication)
- Client-side Zod validation
- Token storage
- User flow management

Prerequisites: Complete tutorials 01, 02, and 03 first

---

#### [05 - Register Implementation](./05-REGISTER-IMPLEMENTATION.md)

**Building a registration form with password validation.**

Learn how to:

- Handle multi-step forms (email → password → confirm)
- Validate password strength with Zod
- Show validation errors clearly
- Implement progressive disclosure
- Handle registration flow

Prerequisites: Complete tutorial 04 first

---

#### [06 - Journal Commands](./06-JOURNAL-ADD-IMPLEMENTATION.md)

**Implementing journal commands: add, show, and amend.**

Learn how to:

- **Add command**: Create or edit entries with external editor integration
- **Show command**: Display entries with metadata and statistics
- **Amend command**: Edit existing entries only (fails if entry doesn't exist)
- Parse and validate date inputs (today, yesterday, YYYYMMDD)
- Detect and launch external editors (vi, vim, nano, VS Code) with fallbacks
- Use temporary files with unique random filenames (security)
- Append and strip template comments
- Save entries with metadata (UUID, timestamps, hashes)
- Provide user feedback with statistics

Prerequisites: Complete tutorial 01 and understand [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md)

---

#### [07 - Journal Sync Command](./07-SYNC-IMPLEMENTATION.md)

**Implementing hash-based journal synchronization with conflict detection.**

Learn how to:

- Understand hash-based three-way comparison for sync
- Extend API client with journal operations (list, get, create, update)
- Implement SHA-256 hash computation for content
- Build sync engine with conflict detection and resolution
- Track sync state per-device using sync metadata
- Handle upload, download, and merge scenarios
- Provide progress feedback during sync operations
- Resolve conflicts by merging content

Prerequisites: Complete tutorials 01, 02, and understand [sync.md](./sync.md)

---

#### [08 - Token Management](./08-TOKEN-MANAGEMENT.md)

**Implementing decoupled, reusable authentication checking across commands.**

Learn how to:

- Understand the problem with coupled token validation (anti-pattern)
- Design a three-layer architecture for auth management
- Implement JWT token utilities (pure functions)
- Build reusable auth middleware (requireAuth, ensureAuthenticated)
- Use auth checking in commands with one line of code
- Write tests for token utilities and auth middleware
- Maintain consistent error messages across the CLI

Prerequisites: Complete tutorials 01 and 02

---

### Architecture Decisions

#### [Architecture: Journal Storage Format](./ARCHITECTURE-JOURNAL-STORAGE.md) 📐

**Why we chose Markdown with YAML frontmatter for journal storage.**

An Architecture Decision Record (ADR) that explains:

- Problem statement and requirements
- Considered alternatives (JSON, SQLite, separate files)
- Decision outcome and rationale
- Implementation details
- Trade-offs and consequences

**Key decision:** Store journals as `.md` files with YAML frontmatter for human-editability and metadata preservation.

---

### Advanced Topics

#### [Sync Strategy](./sync.md)

**Hash-based sync algorithm for conflict detection.**

Covers:

- Three-way comparison using hashes
- Conflict detection logic
- Per-device sync state
- Avoiding the "last modified time" problem

Prerequisites: Understand [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md) first

---

#### [Cold Start Handling](./cold-start-handling.md)

**Managing serverless cold starts in the CLI.**

Learn how to:

- Detect and handle cold starts
- Show appropriate loading messages
- Improve perceived performance

---

#### [Token Expiration Handling](./token-expiration-handling.md)

**Handling JWT token expiration gracefully.**

Covers:

- Detecting expired tokens
- Automatic re-authentication
- User experience considerations

---

## 🚀 Quick Start

If you're new to the project, follow this learning path:

1. **Understand the principles** → Read [TUTOR-PRINCIPLES.md](../../../docs/TUTOR-PRINCIPLES.md)
2. **Set up storage layer** → Follow [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md)
3. **Set up API client** → Follow [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md)
4. **Learn Ink basics** → Read [03-REACT-CLI-COMPONENTS.md](./03-REACT-CLI-COMPONENTS.md)
5. **Build login feature** → Work through [04-LOGIN-IMPLEMENTATION.md](./04-LOGIN-IMPLEMENTATION.md)
6. **Build register feature** → Work through [05-REGISTER-IMPLEMENTATION.md](./05-REGISTER-IMPLEMENTATION.md)
7. **Understand architecture** → Read [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md)
8. **Build journal commands** → Work through [06-JOURNAL-ADD-IMPLEMENTATION.md](./06-JOURNAL-ADD-IMPLEMENTATION.md)
9. **Build sync command** → Work through [07-SYNC-IMPLEMENTATION.md](./07-SYNC-IMPLEMENTATION.md)
10. **Implement token management** → Work through [08-TOKEN-MANAGEMENT.md](./08-TOKEN-MANAGEMENT.md)
11. **Extend the CLI** → Apply what you learned to new features

## 🎯 Common Tasks

### Adding a new command

1. Create handler in `src/commands/<group>/<command>.ts`
2. Define types in `src/commands/types.ts`
3. Register in `src/commands/<group>/index.ts`
4. See [CLAUDE.md](../CLAUDE.md) for details

### Adding API endpoints

1. Add types in `src/lib/api-types.ts`
2. Add method to `ApiClient` class
3. Use in command handlers
4. See [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md)

### Creating UI components

1. Create component in `src/components/`
2. Use Ink primitives (Box, Text)
3. Handle input with `useInput`
4. See [03-REACT-CLI-COMPONENTS.md](./03-REACT-CLI-COMPONENTS.md)

### Building interactive forms

1. Break into reusable components
2. Manage state with hooks
3. Handle step progression
4. See [04-LOGIN-IMPLEMENTATION.md](./04-LOGIN-IMPLEMENTATION.md) and [05-REGISTER-IMPLEMENTATION.md](./05-REGISTER-IMPLEMENTATION.md)

### Working with journal storage

1. Import from `src/lib/storage/`
2. Use `journalStore.save()`, `load()`, `list()`
3. Store as Markdown with YAML frontmatter
4. See [ARCHITECTURE-JOURNAL-STORAGE.md](./ARCHITECTURE-JOURNAL-STORAGE.md) for rationale
5. See [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) for implementation

### Implementing journal commands

1. Use `journalStore` for storage operations
2. Use `parseDate()` utility for date handling
3. For editor-based commands, use `openInEditor()` from `utils/editor.ts`
4. Strip template comments with `stripTemplateComments()`
5. See [06-JOURNAL-ADD-IMPLEMENTATION.md](./06-JOURNAL-ADD-IMPLEMENTATION.md) for complete example

## 📖 Additional Resources

### Main Documentation

- [CLAUDE.md](../CLAUDE.md) - Complete CLI development guide
- [README.md](../../README.md) - Project overview

### External Resources

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Commander.js Guide](https://github.com/tj/commander.js)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

When adding new features:

1. **Follow the principles** in [../../../docs/TUTOR-PRINCIPLES.md](../../../docs/TUTOR-PRINCIPLES.md)
2. **Keep it simple** - Don't over-engineer
3. **Write tests** - Test command handlers and components
4. **Document your work** - Update relevant docs
5. **Use types** - TypeScript everywhere

## 💡 Tips for Success

### Do:

- ✅ Read the existing code first
- ✅ Start with the simplest implementation
- ✅ Test as you go
- ✅ Reuse existing components
- ✅ Follow project conventions

### Don't:

- ❌ Add features "just in case"
- ❌ Over-abstract early
- ❌ Skip type definitions
- ❌ Ignore error handling
- ❌ Forget to test edge cases

## 🐛 Troubleshooting

### "Cannot find module"

Check that all imports use `.js` extensions and paths are correct.

### "Component not rendering"

Verify you're using `render()` from ink and component has no errors.

### "API calls failing"

Check API server is running and URLs are correct.

### "TypeScript errors"

Run `pnpm build` to see all errors. Fix types, don't use `any`.

For more specific issues, see the troubleshooting sections in each guide.

## 📝 Feedback

Found an issue with the documentation? Have suggestions for improvement?

- Open an issue in the repository
- Submit a PR with improvements
- Ask in the team chat

---

**Happy coding! 🚀**
