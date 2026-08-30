---
type: task
status: done
priority: high
createdAt: 2026-08-30T21:08:00.000Z
---

# Update environment summary with the real toolchain

> **Applied in the reflect phase of `gen-001-76ea93`.** `summary.md` and `source-map.md`
> now describe the real repository state.

## Problem

`.reap/environment/summary.md` is loaded into context at every session. It currently
states two things that stopped being true during generation `gen-001-76ea93`:

- "**Rien n'est encore échafaudé.** Aucun `package.json`, aucun `src/`, aucune dépendance
  installée." — all three now exist.
- "## Commandes (à créer au lot 1) — Aucune n'existe encore." followed by a table of
  aspirational scripts.

A summary that lies is worse than no summary: every later generation loads it and plans
against a repository state that no longer exists. The implementation stage may not edit
`environment/` directly, so this is recorded here for the adapt phase.

## Solution

Replace the "État actuel du dépôt" and "Commandes" sections with what the repository now
holds.

Repository layout to record:

```
.
├── index.html, package.json, tsconfig.json
├── vite.config.ts        aliases + vitest config (jsdom, setup file)
├── biome.json            2-space, single quotes, semicolons as needed, width 100
├── playwright.config.ts  testDir tests/e2e, webServer on vite preview :4173
├── src/                  main.tsx, App.tsx, test/setup.ts, and the empty section 12 dirs
├── tests/e2e/            smoke.spec.ts
└── design/, .reap/
```

Commands to record as existing and verified:

| Command | Role |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | `tsc --noEmit && vite build` into `dist/` |
| `npm run preview` | serves the build on :4173 |
| `npm run typecheck` | `tsc --noEmit`, TypeScript strict |
| `npm run check` | Biome format + lint (`check:fix` to write) |
| `npm run test` | Vitest run (`test:watch` for watch mode) |
| `npm run test:e2e` | Playwright against the preview build |

Installed versions to record: vite 8.2.2, react 19.2.8, typescript 7.0.2,
@vitejs/plugin-react 6.1.1, @biomejs/biome 2.5.11, vitest 4.1.11,
@testing-library/react 16.3.3, @playwright/test 1.62.1, jsdom 30.0.1.

Also worth recording, because it will surprise the next generation: **TypeScript 7 removed
`baseUrl`**. Path mappings must be relative and start with `./`. See
`.reap/life/03-implementation.md` for the exact error.

## Files to Change

- `.reap/environment/summary.md` — sections "État actuel du dépôt" and "Commandes".
- `.reap/environment/source-map.md` — the header still says "Aucun de ces modules n'existe
  encore". Still true of the modules themselves, but the directories and their aliases now
  exist; the note should say so.
