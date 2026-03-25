
# Junie by JetBrains

Works in any JetBrains IDE (IntelliJ IDEA, PyCharm, WebStorm, etc.) and as a standalone CLI.

IDE:

1. Open Settings, Tools, AI Assistant, MCP Servers. Click Add and select Streamable HTTP. Enter name `debridge` and URL `https://agents.debridge.com/mcp`.

2. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

3. Restart the IDE. The deBridge tools will appear in the MCP Servers list.

CLI:

1. Create or edit `~/.junie/config.json`:

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

3. Start a Junie session to verify.
