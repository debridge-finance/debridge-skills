
# Goose by Block

1. Edit `~/.config/goose/config.yaml` and add the deBridge MCP server:

```yaml
mcp_servers:
  debridge:
    type: streamable-http
    uri: https://agents.debridge.com/mcp
```

2. Load deBridge skills:

```shell
npx skill debridge-finance/debridge-skills
```

3. Start a new Goose session. Type `/tools` to confirm the deBridge tools are listed.
