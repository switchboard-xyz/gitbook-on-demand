# AI Agents / LLMs

Guidance and patterns for building AI agents and LLM-powered workflows with Switchboard.

## AI-Focused Access Points

Use these endpoints to ingest the docs efficiently or to wire tools directly into structured content.

- **Per-Page Markdown** — Append `.md` to any page URL to retrieve Markdown instead of HTML.
- **`/llms.txt` Routing Hub** — A lightweight router that points to the single best product context file.
- **`/llms-full.txt`** — A minimal pointer to `/llms.txt` (not a full content dump).
- **MCP Server** — Use the MCP endpoint at `docs.switchboard.xyz/~gitbook/mcp` to discover and retrieve docs as structured resources rather than scraping.

Product-specific context files (fetch only one):
- **`/llms-overview.txt`** — High-level overview and quick start.
- **`/llms-price-feeds.txt`** — Pull-based price feeds and chain-specific notes.
- **`/llms-surge.txt`** — Ultra-low latency Surge feeds.
- **`/llms-randomness.txt`** — Verifiable randomness.
- **`/llms-custom-feeds.txt`** — Build and configure custom feeds + task types.
- **`/llms-prediction-market.txt`** — Prediction market integration (Solana/SVM).
- **`/llms-x402.txt`** — X402 micropayments (Solana/SVM).
- **`/llms-protocol.txt`** — Protocol, operators, staking/restaking.
- **`/llms-tooling.txt`** — CLI, SDKs, Crossbar.
- **`/llms-ai-agents.txt`** — Agent skill + programmatic Surge subscription guide.
- **`/llms-reference.txt`** — FAQ and glossary.

## Switchboard Agent Skill

The [Switchboard Agent Skill](switchboard-agent-skill.md) defines an autonomous operator for designing, simulating, deploying, updating, and reading Switchboard feeds and randomness across chains. Use it to configure an agent's behavior: copy the skill content into your agent skill registry or system prompt.

### Install the Skill in Your AI Tool

Preferred setup is an Agent Skills folder (a directory containing `SKILL.md`). Create a folder named `switchboard-agent/` and a `SKILL.md` file inside it, then paste the [raw markdown for the skill](https://docs.switchboard.xyz/ai-agents-llms/switchboard-agent-skill.md) into it.


#### Claude Code (Skill folder)

Project-scoped (recommended for repos):
- `.claude/skills/switchboard-agent/SKILL.md`

Personal (all projects):
- `~/.claude/skills/switchboard-agent/SKILL.md`

```bash
mkdir -p .claude/skills/switchboard-agent
# paste into .claude/skills/switchboard-agent/SKILL.md
```

Invoke:
`/switchboard-agent <your request>`

#### OpenAI Codex (Skill folder)

Repo-scoped (recommended):
- `.agents/skills/switchboard-agent/SKILL.md`

User-scoped (all repos):
- `~/.agents/skills/switchboard-agent/SKILL.md`

```bash
mkdir -p .agents/skills/switchboard-agent
# paste into .agents/skills/switchboard-agent/SKILL.md
```

Optional (recommended): add a single short line to `AGENTS.md`:
```text
Use the switchboard-agent skill for Switchboard feeds/randomness tasks.
```

Invoke:
Run `/skills`, or type `$` and select `switchboard-agent`.

#### OpenClaw

Install the Switchboard Data Operator skill from [clawhub.ai](https://clawhub.ai/oakencore/switchboard-data-operator).
