# Building a Monorepo from Scratch - Complete Tutorial Series

Welcome to the complete guide for building a production-ready monorepo with TypeScript, pnpm, and Turborepo! This tutorial series takes you from zero to a fully-functional multi-package repository.

## What You'll Build

By the end of this series, you'll have created:

- 📦 **Shared Package** - Reusable utilities, types, and functions
- 🚀 **REST API** - Express server with TypeScript
- 💻 **CLI Application** - Terminal UI with Ink (React for the terminal!)
- 🔧 **Complete Tooling** - Testing, linting, formatting, and build orchestration

All packages share code, work together seamlessly, and build in seconds with smart caching.

## Who This Is For

This tutorial is perfect for:

- **Beginners** who want to learn monorepos from scratch
- **Developers** transitioning from multiple repos to a monorepo
- **Teams** looking to consolidate their codebase
- **Anyone** who wants to share code between projects efficiently

**Prerequisites:**

- Basic JavaScript/TypeScript knowledge
- Node.js 18+ installed
- Familiarity with npm/package managers
- A code editor (VS Code recommended)

## Tutorial Series

### [Part 1: Introduction and Setup](01-introduction-and-setup.md)

**What you'll learn:**

- What monorepos are and why they're powerful
- How to set up pnpm workspaces
- Configuring Turborepo for smart builds
- Setting up TypeScript for ESM

**What you'll build:**

- Project foundation with all configuration files
- Workspace structure ready for packages

**Time:** ~15 minutes

**Verification:** Run `pnpm build` and see "No projects in scope"

---

### [Part 2: Creating Your First Package](02-your-first-package.md)

**What you'll learn:**

- How to structure a package in a monorepo
- TypeScript configuration and ESM imports
- Creating utilities and type definitions
- Writing and running tests

**What you'll build:**

- `@myapp/shared` package with utilities
- Data types and validation functions
- Comprehensive test suite

**Time:** ~25 minutes

**Verification:** Run `pnpm build` and `pnpm test` - all should pass

---

### [Part 3: Building the API](03-building-the-api.md)

**What you'll learn:**

- How to create packages that depend on other packages
- Setting up Express with TypeScript
- Using workspace dependencies
- TypeScript project references

**What you'll build:**

- `@myapp/api` package with REST endpoints
- User management API (CRUD operations)
- Integration with shared package

**Time:** ~30 minutes

**Verification:** Start API and test endpoints with curl

---

### [Part 4: Building the CLI](04-building-the-cli.md)

**What you'll learn:**

- Building CLI applications with Ink
- Using React in a terminal environment
- Creating executable commands
- Making interactive terminal UIs

**What you'll build:**

- `@myapp/cli` package with terminal UI
- Interactive command-line application
- Installable global command

**Time:** ~25 minutes

**Verification:** Run `myapp` command and see beautiful terminal UI

---

### [Part 5: Workflow and Best Practices](05-workflow-and-best-practices.md)

**What you'll learn:**

- Development workflows for monorepos
- Testing strategies and debugging tips
- Code quality tools (ESLint, Prettier)
- CI/CD setup and deployment
- Performance optimization with Turbo

**What you'll build:**

- Complete development workflow
- Pre-commit hooks
- CI/CD pipeline configuration

**Time:** ~30 minutes

**Verification:** Run full workflow from dev to deployment

---

## Tutorial Approach

This series follows a **top-down approach**:

1. **Big Picture First** - Understand what you're building before diving into details
2. **Incremental Progress** - Each tutorial builds on the previous one
3. **Verification Steps** - Test your work at the end of each part
4. **Practical Examples** - Real code you can use in production
5. **Learn by Doing** - Hands-on exercises throughout

## What Makes This Different

Most monorepo tutorials:

- ❌ Assume you already know the ecosystem
- ❌ Skip over important configuration details
- ❌ Don't explain _why_ things work
- ❌ Leave you with a toy example

This series:

- ✅ Starts from absolute basics
- ✅ Explains every configuration file
- ✅ Shows real-world patterns
- ✅ Gives you production-ready code
- ✅ Teaches debugging and troubleshooting

## Technology Stack

You'll work with modern, industry-standard tools:

- **pnpm** - Fast, disk-efficient package manager
- **Turborepo** - High-performance build system with caching
- **TypeScript** - Type-safe JavaScript
- **ESM** - Modern JavaScript modules
- **Vitest** - Fast, modern testing framework
- **Express** - Popular Node.js web framework
- **Ink** - React renderer for terminal applications
- **ESLint & Prettier** - Code quality and formatting

## Project Structure

By the end, your project will look like this:

```
my-monorepo/
├── packages/
│   ├── shared/           # Utilities and types
│   ├── api/              # Express REST API
│   └── cli/              # Ink terminal app
├── turbo.json            # Build orchestration
├── tsconfig.base.json    # Shared TypeScript config
├── eslint.config.js      # Linting rules
├── .prettierrc.json      # Code formatting
├── package.json          # Root dependencies
└── pnpm-workspace.yaml   # Workspace definition
```

## Key Concepts You'll Master

1. **Workspace Protocols** - How packages reference each other
2. **Build Orchestration** - Turbo's dependency-aware builds
3. **TypeScript References** - Incremental compilation
4. **ESM Imports** - Modern module system gotchas
5. **Monorepo Workflows** - Daily development patterns
6. **Code Sharing** - DRY across multiple packages

## Time Commitment

- **Total time:** ~2-2.5 hours
- **Per tutorial:** 15-30 minutes
- **Pace:** Take breaks, experiment, and explore!

You can complete the entire series in one sitting or spread it across multiple sessions.

## Getting Help

If you get stuck:

1. Check the **Common Issues** section in each tutorial
2. Review the **Verification** steps to ensure previous parts work
3. Look at the complete code in this repository
4. Ask questions in GitHub Issues

## After Completing This Series

You'll be able to:

- ✅ Build and maintain monorepos confidently
- ✅ Share code between multiple packages efficiently
- ✅ Use Turborepo for fast, cached builds
- ✅ Configure TypeScript for complex projects
- ✅ Implement modern JavaScript tooling
- ✅ Scale to dozens or hundreds of packages
- ✅ Explain monorepo benefits to your team

## Real-World Applications

The patterns you'll learn power:

- **Google** - Billions of lines of code in one repo
- **Meta** - React, React Native, and more
- **Microsoft** - VS Code, TypeScript compiler
- **Your next project!** - Start small, scale up

## Let's Get Started!

Ready to dive in? Start with:

👉 **[Part 1: Introduction and Setup →](01-introduction-and-setup.md)**

## Quick Start (For the Impatient)

If you want to see the final result first:

```bash
# Clone or navigate to the completed monorepo
cd monorepo

# Install dependencies
pnpm install

# Build everything
pnpm build

# Run tests
pnpm test

# Start API
cd packages/api && pnpm dev

# Run CLI
cd packages/cli && pnpm start
```

Then go through the tutorials to understand _how_ and _why_ it all works!

## Feedback and Contributions

Found a typo? Have a suggestion? Want to improve the tutorials?

- Open an issue
- Submit a pull request
- Share what you learned

This is a living tutorial series that improves with your feedback!

---

**Happy learning, and welcome to the world of monorepos!** 🚀

Start here: [Part 1: Introduction and Setup →](01-introduction-and-setup.md)
