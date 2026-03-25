
# OpenClaw

1. Open your OpenClaw project configuration file. Add the deBridge MCP server:

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

3. Start or restart the OpenClaw agent. It will connect to the deBridge server and register all available tools on startup.
