# Ruflo — Claude Code Configuration

## Contributors

This repository has more than one human contributor. When you see a commit author that is **not** the current user, treat that work as a peer's:

| Author | GitHub | Role / scope |
|--------|--------|--------------|
| defaltho | `defaltho` | Project owner. UI/UX, design system, dashboard, widgets, calendar, settings. Default contributor. |
| Luis Miguel | `luisjsmiguel-tech` (`237356165+luisjsmiguel-tech@users.noreply.github.com`) | Co-contributor. Owns the **Analytics tab** (`src/pages/Analytics.tsx`) and chart helpers (`src/utils/chart.ts`). |

### Rules when working with another contributor's code

1. **Don't silently restyle another contributor's surface.** Luis owns Analytics. Don't refactor `Analytics.tsx` to match the design system unless the current user explicitly says so — flag drift instead of fixing it.
2. **Cherry-pick over merge.** When the current user asks to "pull only X's changes" or "bring just the analytics tab", use `git checkout origin/main -- <path>` for the specific files, not `git pull` which would merge everything. The user's local branch usually has heavy WIP that a full merge would tangle.
3. **Identify ownership before editing.** Before touching `Analytics.tsx` or `chart.ts`, run `git log -n 3 -- <file>` to see who last wrote it. If it's a peer's code, ask the current user whether the change is wanted on this branch or should be left for the peer.
4. **Don't credit yourself for a peer's work.** When summarising changes after a cherry-pick, attribute the file's logic to the original author ("Luis's Analytics implementation"), not to the current session.

## On Conversation Start

When starting a new conversation in this project, ALWAYS check for remote updates first:
1. Run `git fetch origin` silently
2. Compare local and remote with `git status` and `git rev-list HEAD..origin/main --count`
3. If there are remote updates available, ask the user: "Há atualizações no repositório remoto. Queres fazer git pull para atualizar?"
4. If the user says yes, run `git pull origin main`
5. If already up to date, proceed normally without mentioning it
6. **Mention WHO authored the new commits** when reporting remote updates — e.g. "2 novos commits do Luis no Analytics" — so the user can decide whether to pull everything or cherry-pick.

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- Keep files under 500 lines
- Validate input at system boundaries

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team

```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
Agent({ prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder", name: "coder", run_in_background: true })
Agent({ prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester", name: "tester", run_in_background: true })
Agent({ prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer", name: "reviewer", run_in_background: true })

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" })
```

### Patterns

| Pattern | Flow | Use When |
|---------|------|----------|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev) |
| **Fan-out** | Lead → A, B, C → Lead | Independent parallel work (research) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor) |

### Rules

- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning: STOP, tell user what's running, wait for results
- NEVER poll status — agents message back or complete automatically

## Swarm & Routing

### Config
- **Topology**: hierarchical-mesh (anti-drift)
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### Agent Routing

| Task | Agents | Topology |
|------|--------|----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

### When to Swarm
- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### Model Routing (Anthropic-only)

| Tier | Model | Use Cases |
|------|-------|-----------|
| 1 | Agent Booster (WASM) | Simple transforms — skip LLM entirely, use Edit directly |
| 2 | Haiku 4.5 (`claude-haiku-4-5-20251001`) | Docs, config, single-file edits, test gen, git messages, data transforms, simple bug fixes, boilerplate |
| 3 | Sonnet 4.6 (`claude-sonnet-4-6`) | Multi-file reads, feature implementation, code review, moderate reasoning |
| 4 | Opus 4.7 (`claude-opus-4-7`) | Architecture, security audits, complex multi-file refactor, novel reasoning |

**No local fallback** — `models.local.enabled=false`, `ollama.enabled=false`. All inference goes to Anthropic. Tier escalation is automatic based on task complexity scoring.

## Memory & Learning

### Before Any Task
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Tools (use `ToolSearch("keyword")` to discover)

| Category | Key Tools |
|----------|-----------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` |
| **Bridge** | `memory_import_claude`, `memory_bridge_status` |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` |
| **Hooks** | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch` |
| **Security** | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

### Background Workers

| Worker | When |
|--------|------|
| `audit` | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features |
| `map` | Every 5+ file changes |
| `document` | After API changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
**Security**: `security-architect`, `security-auditor`
**Performance**: `performance-engineer`, `perf-analyzer`
**Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
**GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
