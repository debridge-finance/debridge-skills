
# Databricks (Genie Code)

1. Add the deBridge MCP server to your Databricks agent configuration:

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

3. The deBridge tools will be available in your Databricks agent workflows.
