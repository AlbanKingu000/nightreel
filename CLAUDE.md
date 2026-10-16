# Working rules for this project

## Context

- Nightreel is a personal, non-commercial project: React 19 + Vite + TypeScript, react-router, zustand, zod,
  fuse.js, Vitest and Playwright.
- One task per prompt. Do exactly that task. Do not start unrelated refactors or "improvements".
- You may work autonomously, but be extra careful with anything that touches design or security (see below).

## Commands

```bash
npm run dev          # dev server (usually http://localhost:5173)
npm run lint         # ESLint
npm run typecheck    # tsc for app and node configs
npm test             # Vitest unit and component tests
npm run test:cov     # Vitest with coverage (80% minimum)
npm run build        # Vite build + SPA fallback (404.html)
npm run preview      # serve the production build
npm run e2e          # Playwright against the production build
npm run verify       # lint, typecheck, test:cov, build, e2e
```

Playwright needs Chromium once: `npx playwright install chromium`.

## Project layout

- `scripts/`: data pipeline (`build-data.ts`) and tested helpers in `scripts/lib`
- `src/data`: zod schemas and catalog loading
- `src/domain`: pure logic (filters, sorting, search, recommendations, spin picker, stats)
- `src/store`: saved lists (zustand + localStorage), import/export
- `src/components`: UI building blocks; `src/pages`: one file per route
- `src/styles/tokens.css`: design tokens
- `e2e/`: Playwright tests

## Definition of done (every task)

1. Run `npm run verify`. Every step must pass. If something fails, fix it. Never skip, delete or weaken a test
   just to make it pass.
2. Add or update unit and/or e2e tests for any behavior you change or add.
3. Test it for real in Google Chrome (you have permission): start the dev server, open the pages you changed,
   click through the new or changed flow, and check the browser console for errors and warnings. Check desktop
   width and a mobile width (~390px).
4. End with a short summary: what changed (files), how you tested it, and anything left open or risky.

## Design (be careful)

- Keep the existing look: colors and tokens in `src/styles/tokens.css`, fonts (Fraunces, Inter, Bebas Neue),
  ticket cards, the marquee, the late-night mood.
- Reuse existing components, CSS modules and tokens. No new UI libraries or CSS frameworks.
- If a task needs a visible design change beyond what was asked, describe it and ask before implementing it.
- Keep accessibility: keyboard navigation, focus states, alt text, reduced-motion support, and the axe checks
  in e2e.

## Security and privacy (be careful)

- No secrets, API keys or tokens in code or in commits.
- The site must stay fully static. User data stays in localStorage only. Do not add analytics, tracking or
  calls to new third-party services.
- Trailers load only from youtube-nocookie.com, and only after the user presses play. Keep it that way.
- Treat all user input and imported backup files as untrusted: validate them with zod and never render raw
  HTML (no `dangerouslySetInnerHTML`).
- Do not add new npm dependencies unless the task really needs one. If it does, explain why and prefer
  well-known, maintained packages.

## Git and GitHub

- The remote is origin = https://github.com/AlbanKingu000/nightreel (public, personal account). Never push unless I
  explicitly ask in the prompt. Never force push. Never change the remote.
- Never change global git config (it may hold a work account). Use repo-local settings only.
- Never use destructive commands (`git reset --hard`, force push, deleting branches) without asking.
- This repo uses a repo-local identity (Alban Meha, personal email) in `.git/config`. Never change it.
- After each task, once `npm run verify` passes and Chrome testing is done, make ONE local commit with a clear
  Conventional Commits message (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`). Never commit
  failing or half-done work.
- Before committing, review `git status` and `git diff --stat`. Stage only files that belong to the task.
  Never run `git add .` or `git add -A` without checking the list first.
- Never add Co-Authored-By or any other AI attribution trailer to commit messages or PR descriptions.

## Data

- Do not run `npm run data` (it calls Wikidata, Wikipedia and YouTube for every film) unless the task asks for it.
- Use only Wikidata (CC0) and Wikipedia (CC BY-SA 4.0) data. No IMDb data, no studio posters or other
  third-party images: poster art is generated (`src/components/Poster.tsx`).
- Do not hand-edit generated data in `public/data/` (`catalog.json`, `details/*.json`). Change the pipeline in
  `scripts/` instead.
