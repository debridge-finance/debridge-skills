
# Cline VS Code Extension

1. Open VS Code, click the Cline icon in the sidebar, then click the MCP Servers button (server icon).

2. Click Add MCP Server, select Streamable HTTP. Enter the name `debridge` and the URL:

```
https://agents.debridge.com/mcp
```

3. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

4. Click Save. The deBridge tools will appear in the MCP Servers panel.
