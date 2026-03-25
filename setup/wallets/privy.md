
# Privy (Embedded Wallet)

Server-side wallets managed by Privy with keys secured in TEEs (Trusted Execution Environments). The agent routes trades via deBridge MCP and signs via Privy MCP. No browser, no wallet popup, no local keys.

```
User prompt → deBridge MCP (quote + tx data) → Privy MCP (sign + broadcast) → On-chain
```

1. Sign up at dashboard.privy.io and create an app.

2. Go to Settings, Basics, API Keys and copy your App ID and App Secret. The App Secret is shown once — copy it immediately. If lost, regenerate it.

3. Install Privy MCP server:

```bash
git clone https://github.com/privy-io/privy-mcp-server.git
cd privy-mcp-server
npm install && npm run build
```

4. Add Privy MCP to your agent (example for Claude Code):

```bash
claude mcp add privy node -- dist/index.js \
  --env PRIVY_APP_ID=<your-app-id> \
  --env PRIVY_APP_SECRET=<your-app-secret>
```

For other environments, add to your MCP server configuration:

```json
{
  "mcpServers": {
    "privy": {
      "command": "node",
      "args": ["<path-to-privy-mcp-server>/dist/index.js"],
      "env": {
        "PRIVY_APP_ID": "<your-app-id>",
        "PRIVY_APP_SECRET": "<your-app-secret>"
      }
    }
  }
}
```

5. Create wallets via Privy MCP and fund them on the source chain.

The agent passes deBridge create_tx output directly to Privy's eth_sendTransaction — no format conversion needed.

Never commit App Secret to git. Keys are managed in TEEs and never exposed.
