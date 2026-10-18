# mirAI PWA: how the code is organised

The teacher and parent app, built with Next.js and TypeScript. There are no real APIs yet: every
screen talks to a mock backend (MSW) that answers the same addresses the real backend will.

## Folders

| Folder                            | What's in it                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/`                            | Next.js pages. Each `page.tsx` shows one screen from `src/screens`. `app/teacher/layout.tsx` and `app/parent/layout.tsx` add the navigation (sign-in pages are shown full screen). Any address with no page shows "Coming soon" (`app/not-found.tsx`). |
| `src/screens/`                    | The screens, by role: `teacher/` and `parent/`. `StartPage` and `ComingSoon` are shared.                                                                                                                                                               |
| `src/layouts/`, `src/components/` | The teacher and parent layouts and shared pieces (password box, code boxes, offline banner…).                                                                                                                                                          |
| `src/services/`                   | Calls to the backend, one file per feature (`plan.ts`, `reports.ts`…). `apiClient.ts` is the only place that calls `fetch`.                                                                                                                            |
| `src/types/`                      | The data shapes the backend sends. `api.ts` holds the shared ones; each feature can add its own file.                                                                                                                                                  |
| `src/mocks/database/`             | The fake database every feature reads: students, cases, parents, screenings, plans, evaluations, notifications.                                                                                                                                        |
| `src/mocks/handlers/`             | The fake API, one file per feature. `shared.ts` holds the endpoints several features use.                                                                                                                                                              |
| `tests/`                          | Jest + Testing Library + MSW. Each feature lists its test pages in `tests/routes/<feature>.tsx`.                                                                                                                                                       |
| `scripts/register-features.mjs`   | Collects `src/mocks/handlers/` and `tests/routes/` into an `index.ts` each (git ignores them), so a feature only adds its own files. It runs by itself before `dev`, `build`, `test`, `typecheck` and `lint`.                                          |

`[studentId]` in a folder name is how Next.js marks the part of the address that changes (the
student's id), so those folders keep their brackets.

## Adding a feature

1. Screens in `src/screens/teacher/` or `src/screens/parent/` (start each file with `"use client";`).
2. A `page.tsx` for each address in `app/` (copy an existing one).
3. The feature's backend calls in `src/services/<feature>.ts`, and any new data shapes in `src/types/<feature>.ts`.
4. The feature's fake endpoints in `src/mocks/handlers/<feature>.ts` (export `handlers`).
5. Its test pages in `tests/routes/<feature>.tsx` (export `pages`) and its tests in `tests/`.
   A test that also needs another feature's page uses `testWithPages("/address")(…)`: it is
   skipped until that page exists.

## Things to know

- Pages render in the browser only: sign-in is kept in `sessionStorage`, which the server can't
  read. `TODO(auth)`: revisit once the real auth (cookies) is merged.
- The mock API runs with `npm run dev` when `NEXT_PUBLIC_USE_MOCKS=true` (see `.env.example`).
  It needs `public/mockServiceWorker.js` (`npx msw@2.7.3 init public --save`).
- The code has no comments. The places where the backend's paths or shapes are still a guess are listed in the team guide ("Backend checks"), not in the code.
- Styling is CSS Modules. Tailwind's utilities are available; its reset is left out.
- The offline service worker isn't set up yet. `TODO`: add PWA offline support.

## Commands

```bash
npm install
npm run dev           # http://localhost:3000
npm run format        # Prettier
npm run check         # typecheck, lint, format check, tests, build
```
