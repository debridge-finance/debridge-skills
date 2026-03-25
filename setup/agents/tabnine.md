
# Tabnine

1. Open your IDE (VS Code or JetBrains) with the Tabnine extension. Go to Tabnine Settings, MCP. Add:

```json
{
  "mcpServers": {
    "debridge": {
      "type": "streamable-http",
      "url": "https://agents.debridge.com/mcp"
    }
  }
}
```

2. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

3. Reload the editor. The deBridge tools will be available in Tabnine agent chat.
