
# JetBrains AI Assistant

Works in any JetBrains IDE (IntelliJ IDEA, PyCharm, WebStorm, etc.).

1. Open Settings, Tools, AI Assistant, MCP Servers. Click Add and select Streamable HTTP. Enter name `debridge` and URL `https://agents.debridge.com/mcp`.

2. Load deBridge skills from the terminal:

```shell
npx skill debridge-finance/debridge-skills
```

3. Restart the IDE. The deBridge tools will appear in the AI Assistant MCP panel.
