
# Amazon Q Developer

Works in VS Code, JetBrains IDEs, and the Q Developer CLI.

IDE:

1. Open your IDE with the Amazon Q extension. Go to Amazon Q Settings, MCP Servers. Add:

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

3. Reload the IDE. The deBridge tools will be available in Amazon Q chat.

CLI:

1. Edit `~/.aws/amazonq/mcp.json`:

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

3. Start a new Q Developer CLI session to verify.
