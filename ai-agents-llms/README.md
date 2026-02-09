# AI Agents / LLMs

Guidance and patterns for building AI agents and LLM-powered workflows with Switchboard.

## AI-Focused Access Points

Use these endpoints to ingest the docs efficiently or to wire tools directly into structured content.

- **Per-Page Markdown** — Append `.md` to any page URL to retrieve Markdown instead of HTML.
- **`/llms.txt` Index** — A site-level index of all pages as Markdown URLs with titles.
- **`/llms-full.txt`** — The entire site content in a single file. Useful for smaller docsets or offline "packs."
- **MCP Server** — Use the MCP endpoint at `docs.switchboard.xyz/~gitbook/mcp` to discover and retrieve docs as structured resources rather than scraping.

## Switchboard Agent Skill

The [Switchboard Agent Skill](switchboard-agent-skill.md) defines an autonomous operator for designing, simulating, deploying, updating, and reading Switchboard feeds and randomness across chains. Use it to configure an agent's behavior: copy the skill content into your agent skill registry or system prompt.

### Install the Skill in Your AI Tool

Preferred setup is an Agent Skills folder (a directory containing `SKILL.md`). Create a folder named `switchboard-data-operator/` and a `SKILL.md` file inside it, then paste the full "Skill (Full Markdown)" block below into `SKILL.md`.

Keep the YAML frontmatter (`--- name: ... description: ... ---`).

Do not include the outer docs-site code fences.

#### Claude Code (Skill folder)

Project-scoped (recommended for repos):
- `.claude/skills/switchboard-data-operator/SKILL.md`

Personal (all projects):
- `~/.claude/skills/switchboard-data-operator/SKILL.md`

```bash
mkdir -p .claude/skills/switchboard-data-operator
# paste into .claude/skills/switchboard-data-operator/SKILL.md
```

Invoke:
`/switchboard-data-operator <your request>`

#### OpenAI Codex (Skill folder)

Repo-scoped (recommended):
- `.agents/skills/switchboard-data-operator/SKILL.md`

User-scoped (all repos):
- `~/.agents/skills/switchboard-data-operator/SKILL.md`

```bash
mkdir -p .agents/skills/switchboard-data-operator
# paste into .agents/skills/switchboard-data-operator/SKILL.md
```

Optional (recommended): add a single short line to `AGENTS.md`:
```text
Use the switchboard-data-operator skill for Switchboard feeds/randomness tasks.
```

Invoke:
Run `/skills`, or type `$` and select `switchboard-data-operator`.

#### OpenClaw (Skill folder)

Workspace-scoped:
- `skills/switchboard-data-operator/SKILL.md`

User-scoped:
- `~/.openclaw/skills/switchboard-data-operator/SKILL.md`

```bash
mkdir -p skills/switchboard-data-operator
# paste into skills/switchboard-data-operator/SKILL.md
```

Invoke (works even if the slash command name is sanitized):
`/skill switchboard-data-operator <your request>`

If a per-skill slash command exists, it may appear as `/switchboard_data_operator` (underscores).
