
# Kiro by Amazon

1. Open Kiro and go to Settings, MCP Servers. Click Add and paste:

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

3. Save and restart Kiro. The deBridge tools will appear in the tools panel.
