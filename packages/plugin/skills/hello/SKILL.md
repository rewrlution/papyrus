---
name: hello
description: Verify Papyrus is installed and working. Say hello.
---

# /papyrus:hello

1. Read the plugin version:

```bash
node -e "console.log(require('${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json').version)"
```

2. Say (substituting the actual version number from step 1):

> "Hello from Papyrus v{version}! Your plugin is installed and working correctly."
