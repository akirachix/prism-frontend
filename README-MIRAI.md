# Mirai portals (parent + teacher) in the Prism scaffold

Mirai's parent and teacher portals, rebuilt in the Prism feature-module format.
Sign-in uses the real backend auth endpoints; nothing about auth is hardcoded.

## Install

    npm install react-hook-form      # the only new dependency (forms use React Hook Form)
    cp .env.example .env.local       # then set NEXT_PUBLIC_API_BASE_URL
    npm run dev

## Layout

    app/                 thin routes only: (auth)/…, parent/…, teachers/…, (app)/dashboard
    app/mirai.css        Mirai's look (Quicksand, navy/red/cream); imported after globals.css
    components/ui|layout shared UI (Button, TextField, CodeInput, AuthShell, PortalFrame…)
    lib/                 config, http (Bearer + refresh-on-401), data-source, pending, format
    features/<name>/     endpoints.ts  api.ts  types.ts  adapters.ts  mocks.ts  screens/  components/
      auth/  parent/  teacher/

Rules: a screen never calls `fetch`; it calls the feature's `api.ts`. Endpoint paths
live only in `endpoints.ts`. Backend shapes are converted to screen shapes only in
`adapters.ts`. Mocks live only in `mocks.ts`.

## Mock switch

`NEXT_PUBLIC_USE_MOCKS=true` makes every `fromSource({ api, mock })` use the mock.
Default is `false` (real API). There is no silent fallback from API to mock.

## Auth (all real endpoints)

`POST /auth/login` returns a stage, then the app follows it:
`password_change_required` → `/auth/change-password` · `mfa_enrollment_required` →
`/auth/mfa/enroll` + `/enroll/confirm` · `mfa_required` → `/auth/mfa/verify`
(6-digit authenticator code). Tokens: `/auth/refresh` (single-flight, on 401),
`/auth/logout`, `/auth/me`. Invitation and reset use the e-mailed links
`/accept-invitation?token=` and `/reset-password?token=`; forgot-password is inline on login.
After sign-in the role decides the home: PARENT → `/parent/dashboard`,
TEACHER → `/teachers/home`, admins → `/dashboard`.

## Features the backend cannot serve yet (explicit errors in real mode)

Real mode rejects with "<feature> is not available yet: the backend has no endpoint for it."
Mock mode works. To switch one on, replace its `pendingEndpoint(...)` in `api.ts`.

- Students list / add student, schools (child name, DOB, class, admission no., school page)
- Parent and teacher screening questionnaires
- Report PDF download
- Change password while signed in
- Parent → child link: the parent's case is found through the parent's own notifications
  (`listMyCases` in `features/parent/api.ts`); replace it when `/students` exists.

## Backend gaps found while testing (not fixed here)

- `cases`, `ieps`, `reports`, `iep-evaluation-*`, `notifications` routers have no auth or scoping.
- Evaluation answers are unique per question *and role*, not per parent.
- `seed_demo_data.py` stores IEP goals/strategies as objects; `IEPRead` expects strings, so
  `GET /ieps/case/{id}/active` returns 500 on seeded data. Unhandled 500s also lack CORS
  headers, so the browser reports them as "cannot reach the server".

## Verified

Mock mode: 39 browser checks. Real backend (throwaway copy, seeded): 19 checks covering
MFA setup/verify, forced password change, invitation, reset, refresh recovery, logout
revocation, role guards, evaluation PATCH, reports, teacher home/students/to-do.
Not run here: ESLint, `next build` and the real `react-hook-form` package (no npm access);
pixel comparison with Figma (screens not received).
