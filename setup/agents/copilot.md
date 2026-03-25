
# GitHub Copilot in VS Code

1. Open Settings (`Ctrl+,`), search for `chat.mcp.enabled`, and make sure it is checked.

2. Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "debridge": {
      "type": "streamable-http",
      "url": "https://agents.debridge.com/mcp"
    }
  }
}
```

3. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

4. Reload the VS Code window. A Start button will appear above the server entry — click it, or Copilot will start it automatically.
