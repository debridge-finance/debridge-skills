---
title: Subgraph Queries via The Graph
impact: MEDIUM
impactDescription: "Protocol-specific on-chain data via GraphQL subgraph queries"
tags: the-graph, subgraph, graphql, uniswap, aave, protocol-data
---

# Subgraph Queries

The Graph indexes blockchain data into queryable subgraphs. Use to access protocol-specific data that general explorers do not expose: Uniswap pool positions, Aave lending rates, token holder distributions, and more.

## Installation

The Graph MCP is a hosted SSE endpoint. A Gateway API key is required.

Get a key at [thegraph.com/studio](https://thegraph.com/studio).

```bash
# Claude Code
claude mcp add thegraph -- npx mcp-remote https://subgraphs.mcp.thegraph.com/sse \
  --header "Authorization:Bearer <your-gateway-key>"
```

```json
// Claude Desktop (requires mcp-remote bridge)
{
  "mcpServers": {
    "thegraph": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://subgraphs.mcp.thegraph.com/sse",
        "--header",
        "Authorization:Bearer <your-gateway-key>"
      ]
    }
  }
}
```

## Key Tools

### Discovery

| Tool | Parameters | Description |
|------|-----------|-------------|
| `search_subgraphs_by_keyword` | `keyword` | Find subgraphs by protocol name or topic, ranked by signal |
| `get_top_subgraph_deployments` | `contract_address`, `chain_name` | Top 3 deployments by query volume for a contract |
| `get_deployment_30day_query_counts` | `ipfs_hashes` (array) | Query volume stats for deployments |

### Schema Inspection

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_schema_by_subgraph_id` | `subgraph_id` (e.g., "5zvR82...") | GraphQL schema for current deployment |
| `get_schema_by_deployment_id` | `deployment_id` (0x...) | Schema for a specific immutable deployment |
| `get_schema_by_ipfs_hash` | `ipfs_hash` (Qm...) | Schema by IPFS content hash |

### Query Execution

| Tool | Parameters | Description |
|------|-----------|-------------|
| `execute_query_by_subgraph_id` | `subgraph_id`, `query` | Run GraphQL against latest deployment |
| `execute_query_by_deployment_id` | `deployment_id`, `query` | Run against a specific immutable deployment |
| `execute_query_by_ipfs_hash` | `ipfs_hash`, `query` | Run against a specific content-addressed deployment |

## Workflow

### Step 1: Find a Subgraph

```
Call mcp__thegraph__search_subgraphs_by_keyword:
  keyword: "uniswap v3 arbitrum"

Returns subgraph IDs, names, descriptions, signal amounts.
Pick the one with the highest signal.
```

### Step 2: Inspect the Schema

```
Call mcp__thegraph__get_schema_by_subgraph_id:
  subgraph_id: "5zvR82..."

Returns the GraphQL schema — entity types, fields, relationships.
Identify which entities and fields to query.
```

### Step 3: Execute a Query

```
Call mcp__thegraph__execute_query_by_subgraph_id:
  subgraph_id: "5zvR82..."
  query: |
    {
      pools(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        token0 { symbol }
        token1 { symbol }
        totalValueLockedUSD
        volumeUSD
      }
    }

Returns top 5 Uniswap V3 pools on Arbitrum by TVL.
```

## Example: Check Pool Liquidity Before Bridge

```
1. Find the Uniswap V3 subgraph on the destination chain:
   Call search_subgraphs_by_keyword: "uniswap v3 base"

2. Query pools containing the destination token:
   Call execute_query_by_subgraph_id:
     query: |
       {
         pools(
           where: { token0: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" }
           orderBy: totalValueLockedUSD
           orderDirection: desc
           first: 3
         ) {
           totalValueLockedUSD
           volumeUSD
           feeTier
         }
       }

3. If TVL is sufficient for the bridge amount → proceed.
   If TVL is low → suggest a different destination chain or token.
```

## Common Subgraph IDs

Agents should search for subgraph IDs dynamically using `search_subgraphs_by_keyword` rather than hardcoding them. Subgraph deployments change over time.

## Rate Limits

The Graph Gateway charges per query. Free tier includes a monthly query allowance. Monitor usage at [thegraph.com/studio](https://thegraph.com/studio).
