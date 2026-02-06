# AI Agents / LLMs

Guidance and patterns for building AI agents and LLM-powered workflows with Switchboard.

## AI-Focused Access Points

Use these endpoints to ingest the docs efficiently or to wire tools directly into structured content.

### Per-Page Markdown

Append `.md` to any page URL to retrieve Markdown instead of HTML.

### `/llms.txt` Index

A site-level index of all pages as Markdown URLs with titles.

### `/llms-full.txt`

The entire site content in a single file. Useful for smaller docsets or offline "packs."

### MCP Server

Use the MCP endpoint at `docs.switchboard.xyz/~gitbook/mcp` to discover and retrieve docs as structured resources rather than scraping.
