
# Anthropic Claude Code CLI

1. Add the deBridge MCP server:

```shell
claude mcp add --transport http debridge https://agents.debridge.com/mcp
```

2. Load deBridge skills:

```shell
npx skill debridge-finance/debridge-skills
```

3. Restart the Claude Code session. Type `/mcp` to confirm the deBridge server is connected.
