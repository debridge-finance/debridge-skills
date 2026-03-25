
# OpenAI Codex CLI

1. Add the deBridge MCP server to your Codex configuration:

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

3. Start a new Codex session. The deBridge tools will be available automatically.
