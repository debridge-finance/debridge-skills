
# Mux by Coder

1. Add the deBridge MCP server to your Mux configuration:

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

2. Load deBridge skills:

```shell
npx skill debridge-finance/debridge-skills
```

3. Start a new Mux session. The deBridge tools will be available for parallel agentic workflows.
