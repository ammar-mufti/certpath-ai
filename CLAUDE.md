# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (run from root)
npm run dev          # Vite dev server
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint (flat config, ESLint 9+)
npm run preview      # Preview production build

# Worker (run from worker/)
cd worker
npx wrangler dev     # Local worker dev server
npx wrangler deploy  # Deploy to Cloudflare
```

No test suite is configured.

## Environment Variables

**Frontend** (`.env.local`):
```
VITE_WORKER_URL=https://your-worker.workers.dev
VITE_GITHUB_CLIENT_ID=your-github-oauth-app-id
```

**Worker** (set via `wrangler secret put` or dashboard):
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `GROQ_API_KEY`, `ADMIN_EMAIL`
Plus `USER_KV` KV namespace binding (defined in `worker/wrangler.jsonc`).

## Architecture

### Stack
- **Frontend:** React 19 + TypeScript + Vite, deployed to GitHub Pages at base path `/certpath-ai/`
- **Backend:** Single Cloudflare Worker (`worker/src/index.ts`, ~965 lines) — handles auth, LLM proxying, admin APIs
- **State:** Zustand stores (`src/store/`)
- **Styling:** Tailwind CSS with a custom domain-color palette and DM Sans / DM Serif Display fonts

### Auth Flow
Custom JWT auth — no Firebase. The worker signs tokens with HMAC-SHA256 via the Web Crypto API and stores user records in Cloudflare KV (`user_${email}`). Tokens are kept in `localStorage` (`ccxp_jwt`). Three providers: GitHub OAuth, Google OAuth, email/password (rate-limited: 5 failed attempts per 15 min). `src/services/auth.ts` parses/validates JWTs on the frontend; `src/store/authStore.ts` holds the live user state.

### LLM / Content Generation
All LLM calls are proxied through the worker (`POST /api/llm`) to protect the Groq API key. The worker uses `llama-3.3-70b-versatile` with a fallback cascade to smaller Groq models and exponential backoff on 429s. `src/hooks/useStageContent.ts` is the sole content fetch hook; `src/hooks/useQuestionGen.ts` handles exam question generation. Both call `extractJson()` from `src/services/llm.ts` for LLM response parsing. Results are cached in localStorage via `src/services/contentCache.ts` — generated content is never re-fetched for the same cert/domain key. All stages have fallback static content so the UI never renders empty.

### Learning & Exam Flow
Four-stage progressive learning per domain: Summary → Concepts → Deep Dive → Quiz. State is managed in `src/store/learnStore.ts`. Exam sessions (questions, answers, timer) live in `src/store/examStore.ts`. Cert definitions (question counts, passing scores, domains, topics) are in `src/data/certifications.ts` — this is the single source of truth for what's available vs. coming soon.

### Routing
`src/App.tsx` sets up three route layers: public (`/`, `/login`), protected (all cert routes via `<ProtectedRoute>`), and admin (`/admin` via `<AdminRoute>`). Cert-scoped routes use `/:certId/` prefix. Legacy CCXP-only URLs redirect to the cert-generic equivalents. A `MaintenanceGate` component wraps the whole app and blocks non-admins when the worker's `/api/health` endpoint returns maintenance mode.

### Worker API Surface
Key endpoints in `worker/src/index.ts`:
- `GET /api/health` — maintenance flag, announcement banner, Groq status
- `POST /api/llm` — LLM proxy; `type` field selects prompt template (e.g. `stage1-summary`, `generate-questions`, `tutor-chat`)
- `POST /api/admin/track` — activity tracking (exam_completed, domain_studied)
- `GET|POST /api/admin/settings` — maintenance mode, featured cert, banner text
- `GET /api/admin/stats` — user/exam analytics

### Deployment
Frontend auto-deploys to GitHub Pages from `main` via `.github/workflows/`. Worker deploys manually with `npx wrangler deploy` from `worker/`.

## Key Conventions

- **Domain colors** are defined in `tailwind.config.js` (e.g. `bg-strategy-500`, `text-gold-600`). Use these token names, not raw hex values, in components.
- **Cert availability** is controlled by the `available` flag in `src/data/certifications.ts`. Unavailable certs redirect to `ComingSoonPage`.
- **Admin access** is determined by comparing the JWT's email to `ADMIN_EMAIL` in the worker; the frontend reflects this via `authStore.user.isAdmin`.
- The worker is the only place the Groq API key exists — never call Groq directly from frontend code.

## Workflow Rules

### After every feature, fix, or enhancement:
1. /simplify — check code quality and reuse
2. /security-review — check for vulnerabilities  
3. /pathfinder — update codebase map
4. npm run build — verify no TypeScript errors
5. npm run lint — check linting

### Before every deployment:
1. npm run build && npm run lint
2. /security-review
3. /version-bump
4. Frontend: git push main (auto-deploys to GitHub Pages)
5. Worker: cd worker && npx wrangler deploy

### Design & UI changes:
- /design-taste-frontend — component architecture
- /impeccable — design audit and polish
- /high-end-visual-design — premium visual upgrades
- Always use Tailwind domain-color tokens, never raw hex

### Before touching unfamiliar code:
- /smart-explore — token-optimized code search
- /pathfinder — remap if major changes made

