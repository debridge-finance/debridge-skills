
# Letta (formerly MemGPT)

1. Add the deBridge MCP server to your Letta agent configuration:

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

3. Restart the Letta server. The deBridge tools will be available to all agents with MCP access.
