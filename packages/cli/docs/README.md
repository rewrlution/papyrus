# CLI Development Documentation

Welcome to the Papyrus CLI development documentation. This collection of guides will help you understand and extend the CLI application.

## 📚 Documentation Index

### [Tutor Principles](../../../TUTOR-PRINCIPLES.md) 🎯

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

### [01 - API Client Setup](./01-API-CLIENT-SETUP.md)

**How to set up and use the API client for server communication.**

Learn how to:

- Create an HTTP client with Axios
- Manage authentication tokens
- Define and use API types
- Integrate with the shared package
- Test API calls

Prerequisites: Basic TypeScript and HTTP knowledge

---

### [02 - React CLI Components](./02-REACT-CLI-COMPONENTS.md)

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

### [03 - Login Implementation](./03-LOGIN-IMPLEMENTATION.md)

**Complete walkthrough of building a login feature.**

A practical, end-to-end example that combines:

- React components (forms, status messages)
- API integration (authentication)
- Token storage
- User flow management

Prerequisites: Complete tutorials 01 and 02 first

---

### [04 - Storage Layer](./04-STORAGE-LAYER.md)

**Building a cross-platform storage system following XDG standards.**

Learn how to:

- Implement XDG Base Directory specification
- Store config, tokens, and journal entries
- Create platform-agnostic file storage
- Write testable storage classes
- Use popular libraries (xdg-basedir)

Prerequisites: Basic Node.js file I/O knowledge

---

## 🚀 Quick Start

If you're new to the project, follow this learning path:

1. **Understand the principles** → Read [TUTOR-PRINCIPLES.md](../../../TUTOR-PRINCIPLES.md)
2. **Set up storage layer** → Follow [04-STORAGE-LAYER.md](./04-STORAGE-LAYER.md)
3. **Set up API client** → Follow [01-API-CLIENT-SETUP.md](./01-API-CLIENT-SETUP.md)
4. **Learn Ink basics** → Read [02-REACT-CLI-COMPONENTS.md](./02-REACT-CLI-COMPONENTS.md)
5. **Build login feature** → Work through [03-LOGIN-IMPLEMENTATION.md](./03-LOGIN-IMPLEMENTATION.md)
6. **Extend the CLI** → Apply what you learned to new features

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
4. See [01-API-CLIENT-SETUP.md](./01-API-CLIENT-SETUP.md)

### Creating UI components

1. Create component in `src/components/`
2. Use Ink primitives (Box, Text)
3. Handle input with `useInput`
4. See [02-REACT-CLI-COMPONENTS.md](./02-REACT-CLI-COMPONENTS.md)

### Building interactive forms

1. Break into reusable components
2. Manage state with hooks
3. Handle step progression
4. See [03-LOGIN-IMPLEMENTATION.md](./03-LOGIN-IMPLEMENTATION.md)

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

1. **Follow the principles** in [../../../TUTOR-PRINCIPLES.md](./../../../TUTOR-PRINCIPLES.md)
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
