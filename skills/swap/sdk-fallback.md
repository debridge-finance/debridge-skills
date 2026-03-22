---
title: SDK Fallback (Not Yet Available)
impact: LOW
impactDescription: "Placeholder for future SDK-based swap workflow"
tags: sdk, fallback, future
---

# SDK Fallback

The deBridge SDK (`@debridge/sdk`) and CLI (`@debridge/cli`) are **not yet available**.

## Current Alternative

Use the deBridge MCP server. Read ../common/SKILL.md Phase 2 to set up MCP in your environment.

## When SDK Ships

This file will be updated with the SDK-based swap workflow:

```bash
npm install @debridge/sdk
```

```typescript
// Future SDK usage — not yet available
import { deBridge } from "@debridge/sdk";

const estimate = await deBridge.estimateSwap({ /* ... */ });
const tx = await deBridge.executeSwap(estimate);
```

Check the [deBridge documentation](https://docs.debridge.com) for SDK availability updates.
