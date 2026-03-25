
# Windsurf by Codeium

1. Open `~/.windsurf/mcp.json` (or create it) and add the deBridge server:

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

3. Save and reload Windsurf. The hammer icon in the Cascade panel should show the deBridge tools.
