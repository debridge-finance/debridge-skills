
# LM Studio

1. Load a model that supports tool use (Llama 3.x 8B+, Mistral/Mixtral, or other function-calling capable models).

2. Go to Settings, MCP Servers and add:

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

3. Save and restart LM Studio. The deBridge tools will appear in the tools panel.
