
# Qodo Gen

1. Open your editor (VS Code or JetBrains) with the Qodo Gen extension. Go to Qodo Gen settings, MCP server configuration. Add:

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

3. Save and reload the editor.
