# 00 — Feature Inventory

Mapped: 2026-05-02 | Source: Phase 0 discovery subagent

---

## Feature List

| # | Feature | Entry Point | Purpose |
|---|---------|-------------|---------|
| F1 | **Auth & Authorization** | `src/App.tsx:102` | Custom JWT auth (GitHub/Google OAuth + email/password) with KV persistence; ProtectedRoute/AdminRoute guards |
| F2 | **Cert Registry** | `src/data/certifications.ts:1` | Single source of truth for all certifications — domains, topics, exam weights, availability flags |
| F3 | **Dashboard & Cert Selection** | `src/pages/Dashboard.tsx:1` | Cert selection hub with per-cert progress rings and last exam scores; redirects coming-soon certs |
| F4 | **4-Stage Learning Flow** | `src/pages/LearnPage.tsx:1` | Progressive study: Summary → Concepts → Deep Dive → Quiz; AI-generated per domain with static fallbacks |
| F5 | **Exam Engine** | `src/pages/ExamPage.tsx:1` | Full/mini/domain exam modes; AI question generation; countdown timer; answer navigation and submission |
| F6 | **Results & Study Plan** | `src/pages/ResultsPage.tsx:1` | Post-exam score display, domain breakdown, wrong-answer review, AI-generated study plan |
| F7 | **Exam History** | `src/pages/HistoryPage.tsx:1` | Persistent per-cert exam history with domain scores; legacy CCXP→multi-cert migration |
| F8 | **AI Tutor** | `src/components/AI/TutorChat.tsx:1` | Floating, always-available exam coach; 10-message context window; cert-aware system prompt |
| F9 | **LLM Infrastructure** | `src/services/groq.ts:1` | Worker-proxied Groq calls; request queue (2 concurrent, 500ms delay); localStorage content cache; offline banner |
| F10 | **Admin Dashboard** | `src/pages/AdminPage.tsx:1` | Analytics, user management, maintenance mode, featured cert, announcement banner |

---

## Core Files per Feature

### F1 — Auth & Authorization
- `src/store/authStore.ts` — JWT state, user context, token validation
- `src/services/auth.ts` — token storage, JWT parsing helpers
- `src/components/Auth/ProtectedRoute.tsx` — auth guard
- `src/components/Auth/AdminRoute.tsx` → `src/components/Admin/AdminRoute.tsx`
- `src/pages/LoginPage.tsx`, `src/components/Auth/LoginScreen.tsx`
- `worker/src/index.ts` (auth section ~lines 200–450) — OAuth handlers, email/password, JWT signing

### F2 — Cert Registry
- `src/data/certifications.ts` — CERTIFICATIONS array, AVAILABLE_CERTS, COMING_SOON_CERTS exports
- `src/App.tsx:42-63` — availability guard in router

### F3 — Dashboard & Cert Selection
- `src/pages/Dashboard.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/ComingSoonPage.tsx`

### F4 — 4-Stage Learning Flow
- `src/pages/LearnPage.tsx`
- `src/store/learnStore.ts` — progress per cert::domain
- `src/components/Learn/` (all files)
- `src/hooks/useContentGen.ts`, `src/hooks/useStageContent.ts`
- `src/types/content.ts`
- `worker/src/index.ts` (stage prompts ~lines 600–760)

### F5 — Exam Engine
- `src/pages/ExamPage.tsx`
- `src/store/examStore.ts` — session state (questions, answers, currentIndex, timer)
- `src/components/Exam/` (all files)
- `src/hooks/useQuestionGen.ts`, `src/hooks/useTimer.ts`
- `src/services/questionBank.ts`
- `worker/src/index.ts` (generate-questions ~lines 893–910)

### F6 — Results & Study Plan
- `src/pages/ResultsPage.tsx`
- `src/components/Results/` (all files)
- `src/store/historyStore.ts` (writes exam attempt)
- `src/services/activityTracker.ts` — event logging
- `worker/src/index.ts` (study-plan endpoint ~lines 550–600)

### F7 — Exam History
- `src/pages/HistoryPage.tsx`
- `src/store/historyStore.ts`
- `src/components/History/EmptyHistory.tsx`
- `src/types/history.ts`

### F8 — AI Tutor
- `src/components/AI/TutorChat.tsx`
- `src/store/tutorStore.ts`
- `worker/src/index.ts` (tutor-chat endpoint ~lines 806–860)

### F9 — LLM Infrastructure
- `src/services/groq.ts` — Groq API client (calls worker)
- `src/services/llm.ts` — re-export wrapper
- `src/services/requestQueue.ts` — concurrency limiter
- `src/services/contentCache.ts` — localStorage cache with versioning
- `src/App.tsx:19-34` — OfflineBanner component
- `worker/src/index.ts` (POST /api/llm dispatcher + model fallback cascade)

### F10 — Admin Dashboard
- `src/pages/AdminPage.tsx`
- `src/components/Admin/AdminRoute.tsx`
- `src/App.tsx:82-100` — MaintenanceGate
- `worker/src/index.ts` (admin endpoints ~lines 200–250, 500–550)

---

## Boundary Notes

- **F4 and F9 overlap:** learning content generation uses the LLM infra (F9) but stage logic and progress tracking live in F4. Boundary: F4 owns the "what to request"; F9 owns "how to request it."
- **F5 and F9 overlap:** question generation similarly delegates to F9's queue/cache. Boundary drawn the same way.
- **F6 and F7 overlap:** ResultsPage writes to historyStore (F7's store). Boundary: writing the record is F6's responsibility; reading it back is F7's.
- **Legacy CCXP compatibility code** appears in F4 (learnStore), F5 (examStore), F7 (historyStore), and F9 (contentCache). Flagged for duplication report.
