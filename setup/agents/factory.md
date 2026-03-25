
# Factory

1. Open your Factory workspace and navigate to MCP integration settings. Add the deBridge server:

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

2. Factory's Droids will detect the deBridge tools and can invoke them as part of autonomous workflows.
