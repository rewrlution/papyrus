# Typescript

## Modules

CJS vs ESM. Use ESM since it's future proof.
The module systems are different.
CJS: sync import.
ESM: async import.

ESM: top-level await

## tsx, ts-node, tsc

First, `tsx` vs `ts-node`.

```bash
npx ts-node src/index.ts
npx tsx src/index.ts
```

Both tsx and ts-node are typescript runners.
`ts-node` runs ts directly in node.js by compiling ts in memory, it uses `tsc` under the hood. It's mature an widely used, but it is slow, and not great for ESM.

`tsx` is modern ts runner based on `esbuild`, and it's fast.

---

`tsc`, this is the ts compiler, the tool that converts `.ts/.tsx` into js that node.js or browsers can run.

it:

- check types
- compile ts to js
- produce the `/dist` folder

`tsconfig.json` is the instruction.

`tsc` does not:

- run your code
- bundle your code
- optimize/minify code

Modern dev setups are:

- `tsx` for development
- `tsc` for production build and type-checking

Real world example:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js"
  }
}
```

Note:
Using `tsx` (dev) + `tsc` (prod) together is completely normal and whidely recommend, even though there's small differences between the setup.

## tsconfig in depth

### target and module

`"target"`, should it be `esnext` or `es2022`?

`esnext` always targets the latest ECMAScript features that typescript supports, may also includes experimental features.

`es2022`, fixed to the 2022 specification. Recommended for production code to ensure consistent compilation behavior.

with `"target":"es2022"`, the `module` should also set to `ES2022`.

### file structure

- rootDir: "./src"
- outDir: "./dist"

```txt
project/
├── src/           ← Your TypeScript code (rootDir)
│   ├── index.ts
│   └── routes/
├── dist/          ← Compiled JavaScript (outDir)
│   ├── index.js
│   └── routes/
├── tsconfig.json
└── package.json
```

### esModuleInterop

set it to true to allow default imports from CJS modules:

```ts
// ❌ Without esModuleInterop:
import express from 'express'; // Error! express has no default export

// ✅ You'd need to do:
import * as express from 'express';
const app = express.default();

// ✅ With esModuleInterop:
import express from 'express'; // Works! TypeScript adds compatibility
```
