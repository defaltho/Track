# Contributing to Track

Thank you for your interest in contributing. This document covers how to set up the project, the workflow for submitting changes, and the conventions we follow.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Create a branch** from `main`: `git checkout -b feat/your-feature`
5. **Make your changes**
6. **Test** locally: `npm run dev`
7. **Build** to verify: `npm run build`
8. **Commit** following the conventions below
9. **Push** and open a Pull Request against `main`

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/description` | `feat/add-recurring-tasks` |
| Bug fix | `fix/description` | `fix/calendar-dot-overflow` |
| Docs | `docs/description` | `docs/update-data-model` |
| Refactor | `refactor/description` | `refactor/storage-helpers` |

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add yearly spending projection
fix: correct days-left calculation for weekly cycles
docs: update data model schema
refactor: extract localStorage helpers to utils/storage.js
style: adjust card border-radius to match design system
```

## Code Style

- **Svelte 5** — use `$state`, `$derived`, `$effect` runes
- **CSS** — use CSS custom properties from `src/styles/variables.css`; no inline styles
- **JS** — vanilla JS, no TypeScript; keep files under 300 lines
- **No external APIs** — all data must remain local to the user's browser

## Pull Request Guidelines

- Keep PRs focused: one concern per PR
- Include a clear description of what changed and why
- Reference any related issues (`Closes #12`)
- Ensure `npm run build` passes before submitting

## Reporting Issues

Use [GitHub Issues](https://github.com/defaltho/Track/issues). Include:
- What you expected to happen
- What actually happened
- Browser and OS
- Steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
