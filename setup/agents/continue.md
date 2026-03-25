
# Continue.dev

1. Open `~/.continue/config.yaml` (or create it). Add the deBridge MCP server:

```yaml
mcpServers:
  - name: debridge
    type: streamable-http
    url: https://agents.debridge.com/mcp
```

Or use `~/.continue/config.json`:

```json
{
  "mcpServers": [
    {
      "name": "debridge",
      "type": "streamable-http",
      "url": "https://agents.debridge.com/mcp"
    }
  ]
}
```

2. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

3. Save and reload your editor.
