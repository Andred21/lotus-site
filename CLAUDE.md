# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

`lotus-site` is still the unmodified Vite + React + TypeScript starter scaffold — `src/App.tsx` is the generated welcome page and `README.md` is the stock template README (its content describes the template, not this project). There is no routing, state management, styling framework, or backend yet. Treat almost any real task here as greenfield work rather than a change to existing app logic.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` + `pnpm-workspace.yaml`); do not use npm or yarn.

| Task | Command |
| --- | --- |
| Dev server (HMR) | `pnpm dev` |
| Typecheck + production build | `pnpm build` (= `tsc -b && vite build`) |
| Typecheck only | `pnpm exec tsc -b` |
| Lint | `pnpm lint` |
| Serve the built `dist/` | `pnpm preview` |

No test runner is configured — there is no `test` script and no testing dependency installed. If tests are needed, one has to be set up first (Vitest is the natural fit for a Vite project); don't claim tests pass until a runner actually exists.

`pnpm-workspace.yaml` only carries `minimumReleaseAgeExclude` entries pinning two `@rolldown/binding-*` packages past pnpm's minimum-release-age gate. If a new dependency install is blocked as "too recently published", that list is where an exception goes — this is not a multi-package workspace.

## TypeScript project layout

`tsconfig.json` is a solution file with no sources of its own; it references two projects that `tsc -b` builds together:

- **`tsconfig.app.json`** — includes `src`, DOM lib, `vite/client` types. Application code.
- **`tsconfig.node.json`** — includes only `vite.config.ts`, Node types, `module: nodenext`. Build-time code.

A new build-time script (a Vite plugin, a codegen step, `vitest.config.ts`) must be added to `tsconfig.node.json`'s `include`, or `tsc -b` silently never typechecks it.

Compiler settings that reject code the build would otherwise accept:

- `noUnusedLocals` / `noUnusedParameters` — an unused import or variable **fails `pnpm build`**, not just lint. Common trap when commenting code out mid-edit.
- `erasableSyntaxOnly` — TS syntax with runtime semantics is banned: no `enum`, no constructor parameter properties, no `namespace`. Use union string literals or `const` objects instead of enums.
- `verbatimModuleSyntax` — type-only imports must be written `import type { Foo } from …`, and type-only exports `export type`.
- `allowImportingTsExtensions` — imports carry the source extension (`import App from './App.tsx'`), matching the existing files.

## Lint

Flat config in `eslint.config.js`: `js.configs.recommended`, `typescript-eslint` recommended (untyped — no `parserOptions.project`, so type-aware rules are off), `react-hooks` recommended, and `react-refresh` in Vite mode. The last one means **a file that exports a component should export only components** — adding a helper `export const` next to a component breaks HMR and trips `react-refresh/only-export-components`. Put shared helpers, constants, and hooks in their own modules.

The template README documents how to upgrade to type-aware lint rules (`recommendedTypeChecked` / `strictTypeChecked` plus `parserOptions.project`); that has not been done here.

## Assets and styling

Two asset paths with different semantics — pick deliberately:

- **`src/assets/`** — imported in TS (`import heroImg from './assets/hero.png'`), so Vite fingerprints and bundles them. Use for anything referenced from components.
- **`public/`** — copied verbatim, referenced by absolute URL. `public/icons.svg` is an SVG sprite consumed as `<svg><use href="/icons.svg#github-icon" /></svg>`. New icons go into that sprite as a new `<symbol id>`, not as separate imported files.

Styling is plain hand-written CSS — no Tailwind, no CSS modules, no preprocessor. `src/index.css` defines the design tokens (`--text`, `--bg`, `--accent`, `--sans`, shadows) on `:root` with `color-scheme: light dark`; `src/App.css` holds component styles. New colors and fonts belong in the `:root` token block rather than inline in component CSS.

## Repo notes

`.claude/rules/testing.md` and `.claude/rules/architecture.md` exist but are empty files — no guidance to follow there yet.
