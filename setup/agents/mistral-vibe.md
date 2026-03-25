
# Mistral Vibe

1. Edit `~/.config/mistral-vibe/config.json` (or create it):

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

3. Start a new Vibe session. The deBridge tools will be available automatically.
