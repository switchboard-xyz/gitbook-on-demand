# AI Agents / LLMs

Guidance and patterns for building AI agents and LLM-powered workflows with Switchboard.

## AI-Focused Access Points

Use these endpoints to ingest the docs efficiently or to wire tools directly into structured content.

- **Per-Page Markdown** — Append `.md` to any page URL to retrieve Markdown instead of HTML.
- **`/llms.txt` Index** — A site-level index of all pages as Markdown URLs with titles.
- **`/llms-full.txt`** — The entire site content in a single file. Useful for smaller docsets or offline "packs."
- **MCP Server** — Use the MCP endpoint at `docs.switchboard.xyz/~gitbook/mcp` to discover and retrieve docs as structured resources rather than scraping.

## Switchboard Agent Skill

The [Switchboard Agent Skill](skills/switchboard-agent-skill.md) defines an autonomous operator for designing, simulating, deploying, updating, and reading Switchboard feeds and randomness across chains. Use it to configure an agent's behavior: copy the skill content into your agent skill registry or system prompt.

### Install the Skill in Your AI Tool

Preferred setup is an Agent Skills folder (a directory containing `SKILL.md`). Create a folder named `switchboard-agent/` and a `SKILL.md` file inside it, then paste the [raw markdown for the skill](https://docs.switchboard.xyz/ai-agents-llms/skills/switchboard-agent-skill.md) into it.


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
