# Contributing to Track

Thank you for your interest in contributing. This document covers how to set up the project, the workflow for submitting changes, and the conventions we follow.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 + Expo SDK 52 |
| Language | TypeScript 5 (strict) |
| Navigation | expo-router (file-based) |
| State | Zustand + AsyncStorage (persist middleware) |
| Animations | react-native-reanimated + moti |
| Gestures | react-native-gesture-handler |
| Styling | StyleSheet (RN) + design tokens in `src/theme.ts` |
| Target platforms | iOS, Android, Web (single codebase) |

## Ownership

| Area | Owner |
|------|-------|
| UI / design system / Dashboard / widgets / Calendar / Settings | defaltho |
| Analytics tab (`src/pages/Analytics.tsx`) + chart helpers (`src/utils/chart.ts`) | Luis Miguel |

Before editing a file outside your area, check with the other owner or note it clearly in your PR.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Create a branch** from `main`: `git checkout -b feat/your-feature`
5. **Start** the Expo dev server: `npx expo start --web` (opens on port 8081)
6. **Build** to verify: `npx expo export --platform web`
7. **TypeScript check**: `npx tsc --noEmit`
8. **Commit** following the conventions below
9. **Push** and open a Pull Request against `main`

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/description` | `feat/add-recurring-tasks` |
| Bug fix | `fix/description` | `fix/calendar-dot-overflow` |
| Docs | `docs/description` | `docs/update-data-model` |
| Refactor | `refactor/description` | `refactor/storage-helpers` |
| Wave task | `wave-<wave>-<author>` | `wave-b-luis` |

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(analytics): add period-over-period bar chart
fix(calendar): correct days-left calculation for weekly cycles
docs: update data model schema
refactor(chart): extract curve path helper to utils/chart.ts
feat(wave-b-L4): PeriodCompareWidget initial implementation
```

## Code Style

- **TypeScript** — strict mode, no implicit `any`, no implicit undefined access
- **Files** — keep under 500 lines; split into hooks or utils before growing past that
- **Styles** — use `StyleSheet.create` and design tokens from `src/theme.ts`; no magic numbers
- **State** — all persisted state lives in `src/stores/data.ts`; new models extend, never replace
- **Offline-first** — every feature must work without a network connection

## Pull Request Guidelines

- Keep PRs focused: one concern per PR
- Include a clear description of what changed and why
- Reference any related issues (`Closes #12`)
- Ensure `npx tsc --noEmit` passes before submitting
- Ensure the app runs on web (`npx expo start --web`) without console errors

## Reporting Issues

Use [GitHub Issues](https://github.com/defaltho/Track/issues). Include:
- What you expected to happen
- What actually happened
- Device / browser and OS
- Steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
