
# Aider

Aider supports custom instructions via conventions files. For full MCP and skills support, use AiderDesk (https://github.com/hotovo/aider-desk).

AiderDesk:

1. Open AiderDesk and go to Settings, MCP Servers. Add server with name `debridge` and URL `https://agents.debridge.com/mcp`.

2. Load deBridge skills:

```shell
npx skill debridge-finance/debridge-skills
```

3. Restart AiderDesk. The deBridge tools will be available in the session.

Aider CLI (without AiderDesk):

1. Add deBridge context to your project's CONVENTIONS.md by referencing `https://agents.debridge.com/SKILL.md`.

2. Start Aider with the conventions file:

```shell
aider --read CONVENTIONS.md
```
