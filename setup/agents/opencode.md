
# opencode

1. Open `~/.opencode/config.json` (or project-level config). Add the deBridge MCP server:

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

3. Start a new opencode session and verify:

```shell
opencode tools
```
