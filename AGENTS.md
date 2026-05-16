# Ruflo — Codex Configuration

## On Conversation Start

When starting a new conversation in this project, ALWAYS check for remote updates first:
1. Run `git fetch origin` silently
2. Compare local and remote with `git status` and `git rev-list HEAD..origin/main --count`
3. If there are remote updates available, ask the user: "Há atualizações no repositório remoto. Queres fazer git pull para atualizar?"
4. If the user says yes, run `git pull origin main`
5. If already up to date, proceed normally without mentioning it

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- Keep files under 500 lines
- Validate input at system boundaries

## Secret Handling (CRITICAL — applies to every commit & push)

This repository is **public on GitHub**. Anything committed is permanently leaked, even if later removed. Apply these rules without exception:

### Never write to disk
- API keys (`sk-…`, `gho_…`, `ghp_…`, `github_pat_…`, AWS `AKIA…`)
- Bearer tokens / OAuth secrets
- Database connection strings with passwords
- Private SSH keys, `.pem`, `.key` files
- `.env`, `.env.local`, `.env.production` contents
- Email addresses / phone numbers of real people (use placeholders in examples)
- GitHub Personal Access Tokens inside `git remote` URLs

### Pre-commit checklist (run mentally before every `git add`)
1. Did I introduce any of the patterns above? If unsure, `git diff --staged | grep -iE 'token|secret|key|password|bearer|ghp_|gho_|sk-[a-zA-Z0-9]{20}'`.
2. Am I adding a new directory? Check it's not in `.gitignore` already and doesn't belong there (`.codex/`, `.agents/`, `.env*`, `*.pem`, `*.key` are all ignored).
3. If a config file requires a secret, ship a `*.example` variant with placeholder values and gitignore the real file.

### Pre-push checklist
- Inspect `git log -p origin/HEAD..HEAD` for anything sensitive in commit messages or diffs.
- If a secret was committed by accident: **stop, revoke it immediately**, then rewrite history (`git filter-repo`) and force-push — but only after revoking. Removing from HEAD is not enough.

### Repository hygiene
- Use `git remote set-url origin https://github.com/<owner>/<repo>.git` — never embed PATs in the URL. Authenticate via `gh auth login` or SSH.
- If you see a token, password, email, or any PII in **any** file you're about to commit, stop and ask the user how to handle it instead of committing.
- The pre-commit hook in `scripts/install-git-hooks.sh` runs version bump + must not be bypassed with `--no-verify` unless you have actively confirmed there are no secrets.

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
npx @Codex-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
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
| 2 | Haiku 4.5 (`Codex-haiku-4-5-20251001`) | Docs, config, single-file edits, test gen, git messages, data transforms, simple bug fixes, boilerplate |
| 3 | Sonnet 4.6 (`Codex-sonnet-4-6`) | Multi-file reads, feature implementation, code review, moderate reasoning |
| 4 | Opus 4.7 (`Codex-opus-4-7`) | Architecture, security audits, complex multi-file refactor, novel reasoning |

**No local fallback** — `models.local.enabled=false`, `ollama.enabled=false`. All inference goes to Anthropic. Tier escalation is automatic based on task complexity scoring.

## Memory & Learning

### Before Any Task
```bash
npx @Codex-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @Codex-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @Codex-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @Codex-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
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
npx @Codex-flow/cli@latest hooks worker dispatch --trigger audit
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
npx @Codex-flow/cli@latest init --wizard           # Setup
npx @Codex-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @Codex-flow/cli@latest memory search --query "" # Vector search
npx @Codex-flow/cli@latest hooks route --task ""    # Route to agent
npx @Codex-flow/cli@latest doctor --fix             # Diagnostics
npx @Codex-flow/cli@latest security scan            # Security scan
npx @Codex-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
Codex mcp add Codex-flow -- npx -y @Codex-flow/cli@latest
npx @Codex-flow/cli@latest daemon start
npx @Codex-flow/cli@latest doctor --fix
```

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
