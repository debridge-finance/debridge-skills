
# Visual Studio Code

1. Make sure you have an AI extension installed (Copilot, Cline, Continue, etc.).

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

4. Reload the VS Code window. The deBridge server will start automatically when an MCP-compatible agent needs it.
