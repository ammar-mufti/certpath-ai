# AGENTS.md

## Critical conventions

- **Styling uses CSS variables**, NOT Tailwind utility colors. Use `var(--bg)`, `var(--bg-card)`, `var(--accent)`, `var(--text)`, `var(--text-2)`, `var(--border)` etc. Utility classes `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.input`, `.badge-accent`, `.badge-error`, `.progress-bar` are in `src/index.css`. Do not use raw hex values.
- **TutorChat is controlled by AppShell.** It does NOT manage its own open state. `AppShell` holds `tutorOpen` state, renders `<TutorChat>`, and passes `onOpenTutor` to `CertSidebar` via `React.cloneElement`. Mobile nav opens it via `window.dispatchEvent(new CustomEvent('certpath-open-tutor'))`.
- **LLM content is cached in localStorage** (`src/services/contentCache.ts`). Once generated for a cert+domain+stage combination, it is NEVER re-fetched. Clear cache: `contentCache.clearDomain(certId, domain)`.
- **GitHub Pages base path is `/certpath-ai/`**. Vite is configured for this. All routing uses `BrowserRouter basename="/certpath-ai"`.

## Strict TypeScript

`tsconfig.app.json` has `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`. Unused imports cause build failure. Type-only imports must use `import type`.

## ESLint rules to respect

- `react-hooks/static-components`: Do NOT define components inside render functions. Extract them to module scope.
- `react-hooks/set-state-in-effect`: Avoid calling `setState` directly inside `useEffect`. Use a separate state variable, derived state, or handler instead.
- `react-hooks/purity`: Do NOT call `Date.now()` or other impure functions during render. Use a ref.

## Commands

```bash
npm run build          # tsc -b && vite build (must pass before deploy)
npm run lint           # eslint . (must pass before deploy)
```

No test suite. No formatter configured.

## Architecture highlights

- **Routing:** `src/App.tsx` — three layers: public (`/`, `/login`), protected (`/:certId/learn`, `/:certId/exam/*`, `/:certId/results`, `/:certId/history`), admin (`/admin`). Legacy `/learn`, `/exam`, `/results`, `/history` redirect to `/ccxp/`.
- **State:** Zustand in `src/store/`. Stores: `authStore`, `learnStore`, `examStore`, `tutorStore`, `historyStore`.
- **Certs:** `src/data/certifications.ts` — single source of truth. `isAvailable: false` certs redirect to `ComingSoonPage`.
- **LLM proxy:** All LLM calls go through `POST ${VITE_WORKER_URL}/api/llm` with `type` field selecting prompt template. Never call Groq directly from frontend.
- **Exam flow:** `ExamPage.tsx` uses `<Routes>` for sub-routes (`/exam`, `/exam/loading`, `/exam/question`). ConfigScreen → LoadingScreen → QuestionCard → ResultsPage.
- **Learning flow:** `DomainPage.tsx` loads stages sequentially (s1→s2→s4). `useStageContent` hook fetches from LLM or localStorage cache.

## Directory boundaries

```
src/components/Layout/    — AppShell, CertSidebar (shell components)
src/components/AI/        — TutorChat (AI tutor panel)
src/components/Exam/      — ConfigScreen, QuestionCard, LoadingScreen, etc.
src/components/Learn/     — Stage1Summary, Stage2Concepts, Stage4Quiz
src/components/Results/   — ResultsPage, StudyPlan
src/components/Admin/     — AdminRoute
src/components/Auth/      — ProtectedRoute, LoginScreen (legacy)
src/components/Nav/       — TopNav
src/pages/                — Top-level page components
src/hooks/                — useStageContent, useQuestionGen, useTimer
src/services/             — auth, contentCache, questionBank, llm
src/store/                — Zustand stores
src/data/                 — certifications.ts (cert definitions)
src/context/              — ThemeContext
worker/                   — Cloudflare Worker (backend)
```

## Deploy flow

- **Frontend:** `git push origin main` → auto-deploys via `.github/workflows/deploy.yml` to GitHub Pages. Requires `VITE_WORKER_URL` and `VITE_GITHUB_CLIENT_ID` as repo secrets.
- **Worker:** `cd worker && npx wrangler deploy`. Secrets set via `wrangler secret put` or Cloudflare dashboard.

## Env vars

Frontend (`.env.local`): `VITE_WORKER_URL`, `VITE_GITHUB_CLIENT_ID`
Worker secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `GROQ_API_KEY`, `ADMIN_EMAIL`
Worker KV binding: `USER_KV` (defined in `worker/wrangler.jsonc`)
