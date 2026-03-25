
# Zed by Zed Industries

1. Open Settings (`Cmd+,` on macOS, `Ctrl+,` on Linux). Add the deBridge MCP server:

```json
{
  "context_servers": {
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

3. Save settings and open the AI assistant panel (`Cmd+?`) to confirm deBridge tools are loaded.
