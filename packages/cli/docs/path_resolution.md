# How CLI Name Resolution Works

When you publish a CLI through npm, the command name users type in the terminal is **not guaranteed to be unique**. The OS decides which executable runs, not npm. This is determined entirely by how `PATH` resolution works across macOS, Linux, and Windows.

This post summarizes exactly what happens when multiple tools share the same command name.

---

## 1. How npm Installs CLI Commands

Defining a CLI in `package.json`:

```json
{
  "name": "devlog",
  "bin": { "devlog": "./dist/index.js" }
}
```

When installed globally:

```bash
npm install -g devlog
```

npm creates a small executable file in its global `bin` folder.

Typical npm global bin paths:

**macOS / Linux**

- `/usr/local/bin`
- `~/.npm-global/bin`
- `~/.nvm/versions/node/<version>/bin`

**Windows**

- `%APPDATA%\npm\devlog.cmd`

npm does **not** verify uniqueness outside its own directory. It simply writes its binary and relies on the OS to decide which one runs.

---

## 2. How PATH Resolution Works

When you type:

```bash
devlog
```

The shell searches the directories in your `PATH` **from left to right** and executes the **first matching file**.

```bash
PATH=/usr/local/bin:/usr/bin:/bin:~/.cargo/bin:~/.npm-global/bin
```

### PATH Resolution Diagram

```
+--------------------------------------------+
|                PATH SEARCH                 |
+--------------------------------------------+
| 1. /usr/local/bin        → devlog? no      |
| 2. /usr/bin              → devlog? no      |
| 3. /bin                  → devlog? no      |
| 4. ~/.cargo/bin          → devlog? YES ← runs this one
| 5. ~/.npm-global/bin     → (skipped)       |
+--------------------------------------------+
First match wins.
```

This behavior is identical on macOS and Linux.

---

# 3. Windows-Specific Behavior

Windows resolves files in this priority order:

1. `devlog.exe`
2. `devlog.cmd`
3. `devlog.bat`
4. scripts

This means a Rust or Go tool that installs `devlog.exe` will almost always override an npm CLI (`devlog.cmd`) unless the user rearranges PATH.

---

# 4. What Happens When Names Conflict?

If the user already has a tool named `devlog`:

- Both binaries **coexist** (Rust, Go, Python, system binaries, npm CLI, etc.).
- No tool overwrites another.
- The OS simply picks whichever appears first in `PATH`.

### Consequences:

| Situation                       | What Runs                                 |
| ------------------------------- | ----------------------------------------- |
| Another tool is earlier in PATH | Your CLI is shadowed                      |
| npm global bin is earlier       | Your CLI shadows theirs                   |
| Both exist                      | Only one is reachable by the command name |

npm only warns about clashes **inside npm’s bin**, not other languages or system directories.

---

# 5. How to Check Which `devlog` Is Running

**macOS / Linux**

```bash
which devlog
```

**Windows**

```bash
where devlog
```

This shows the actual executable being used.

## 6. Best Practices for Avoiding Conflicts

### ✅ **1. Choose a unique, short binary name**

Avoid common words. Prefer short, low-collision names such as:

- `dlog`
- `dvlog`
- `logx`
- `devl`
- `dlg`
- `logd`

These are highly unlikely to conflict with existing tools across npm, Rust, Go, or system binaries.

You can still publish your npm package under a descriptive name (e.g., `devlog`, `devlog-cli`) while exposing a safer binary.

---

### ✅ **2. Provide multiple binary aliases**

Let users pick the one that works on their machine:

```json
"bin": {
  "devlog": "./dist/index.js",
  "dlog": "./dist/index.js"
}
```

If `devlog` is taken, `dlog` becomes the escape hatch.

---

### ✅ **3. Detect conflicting binaries at install or runtime**

You can warn the user if another tool named `devlog` is found earlier in `PATH`.

Shell check example:

```sh
if command -v devlog >/dev/null 2>&1; then
  echo "⚠️ Another 'devlog' command already exists at $(command -v devlog)"
fi
```

This doesn’t prevent installation — it just gives transparency.

---

### ✅ **4. Provide an environment variable override**

Allow:

```bash
DEVLOG_BIN_NAME=dlog
```

And expose an alternative entrypoint dynamically.

---

### ✅ **5. Document the conflict behaviour clearly**

Tell users how to check:

- `which devlog` (macOS/Linux)
- `where devlog` (Windows)

and how to reorder PATH if needed.

---

# Summary

- npm installs CLI commands but does **not** handle naming conflicts.
- The OS decides which executable runs based on **PATH ordering**.
- Multiple binaries with the same name can coexist; the first match wins.
- Windows prioritizes `.exe` → `.cmd` → `.bat`, meaning native tools often shadow npm tools.
- Use unique binary names, offer aliases, detect conflicts, and document the behavior.
