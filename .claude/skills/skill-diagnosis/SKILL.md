---
name: skill-diagnosis
description: >
  Analyze why a skill execution failed or was suboptimal, then fix the skill
  or file a bug. Use when: the user corrects the agent's behavior, a skill
  produced wrong output, the agent used ad-hoc commands instead of bundled
  scripts, or any execution didn't match what the skill prescribed. Also use
  proactively after every user correction — do not wait to be asked.
---

# Skill Diagnosis

Analyze execution failures and user corrections, determine the root cause, and take corrective action — either fix the skill in this repo or file a bug upstream.

## When to Trigger

- The user corrects the agent's behavior
- A skill execution fails or produces unexpected results
- The agent used ad-hoc commands instead of bundled scripts
- The agent skipped a prescribed step or used the wrong tool
- The agent asked the user for information it should have auto-discovered

## What to ignore

- issues with RPCs or external services that are out of scope for this repo's skills and scripts
- user errors (e.g., providing wrong token address)
- expected failures due to insufficient balance, missing approvals, or other preconditions not met during testing (these don't require skill changes)

## Diagnosis Process

### Step 1: Identify What Went Wrong

Reconstruct the execution trace from the conversation:

1. **What did the user ask?**
2. **What skill(s) should have been followed?** — Map the request to `skills/` entry points.
3. **What did the agent actually do?** — List the actual tool calls and commands run.
4. **Where did it diverge?** — Find the exact step where the agent deviated from the skill's prescribed flow.
5. **What was the user's correction?**

### Step 2: Classify the Root Cause

| Category | Description |
|----------|-------------|
| **skill-gap** | The skill doesn't mention the correct approach at all |
| **skill-ambiguity** | The skill describes the approach but not clearly enough for the agent to follow reliably |
| **script-missing** | A bundled script should exist but doesn't — the agent had to improvise |
| **script-bug** | A bundled script exists but has a bug or wrong behavior |
| **agent-drift** | The skill is correct but the agent ignored it |
| **external-bug** | Bug in an external tool, MCP server, or dependency |

### Step 3: Take Corrective Action

#### For `skill-gap` or `skill-ambiguity`

Fix the skill directly:

1. Read the relevant SKILL.md and reference files.
2. Edit to add or clarify the missing guidance.
3. Make the fix prescriptive — specify exact commands, scripts, and expected output formats.
4. Add "Do NOT..." anti-patterns if the agent keeps making the same mistake.
5. Run the repo's build/validate pipeline (see CLAUDE.md for commands).

**Good fixes are:**
- Explicit: name the exact script or command, not a vague action
- Complete: include the expected output format so the agent knows what to parse
- Opinionated: if multiple approaches exist, state which to prefer and why

#### For `script-missing`

1. Determine if the script belongs in this repo or is out of scope.
2. If in scope: create it following the repo's scripting conventions (see CLAUDE.md).
3. Update the relevant SKILL.md to reference the new script.
4. Run the build/validate pipeline.

#### For `script-bug`

1. Read the script source and identify the bug.
2. Fix it.
3. Test if possible (dry run, `--help`, sample input).
4. Run the build/validate pipeline.

#### For `agent-drift`

The skill is correct but the agent didn't follow it — the instructions need to be more prominent:

1. Add stronger "MUST" / "Do NOT" language at the decision point where drift occurred.
2. Add an anti-pattern example showing what NOT to do.
3. Run the build/validate pipeline.

#### For `external-bug`

File a bug in the external tool's repository:

1. Ask the user which repo to file against if not obvious.
2. Gather evidence: error message, expected vs actual behavior, reproduction steps.
3. Create the issue via `gh issue create --repo <owner>/<repo>`.
4. Report the issue URL to the user.

### Step 4: Verify

After any skill or script change:

1. Run the repo's build/validate pipeline — must pass.
2. Check that cross-references still resolve (SKILL.md ↔ references).

### Step 5: Save Feedback Memory

Save a feedback memory so the same mistake isn't repeated in future conversations. Include: what went wrong, why, and the rule to follow going forward.

## Output Format

```
Diagnosis: <one-line summary>
Root cause: <category> — <explanation>
Action: <what was fixed or filed>
Files changed: <list>
```
