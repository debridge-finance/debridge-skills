
# Trae by ByteDance

1. Open Trae and go to Settings, MCP Servers. Click Add and enter name `debridge`, type Streamable HTTP, URL `https://agents.debridge.com/mcp`.

Or create `.trae/mcp.json` in your project root:

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

3. Reload the window. The deBridge tools will be available in Builder Mode and chat.
