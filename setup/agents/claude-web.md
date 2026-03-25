
# Claude Web & Desktop by Anthropic

Claude.ai (Web):

1. Go to claude.ai and create a new Project.

2. Under project knowledge, add the deBridge skills URL: `https://agents.debridge.com/SKILL.md`

3. Start a conversation in the project. Claude will use the deBridge skills as context.

Claude Desktop:

1. Open Settings, Developer, Edit Config. This opens `claude_desktop_config.json` located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows.

2. Add the deBridge MCP server:

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

3. Save and restart Claude Desktop completely (quit and reopen).
