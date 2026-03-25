
# Google Gemini CLI

1. Open or create `~/.gemini/settings.json`. Add the deBridge MCP server:

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

3. Start a new session and verify:

```shell
gemini tools list
```
