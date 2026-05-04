# 02 — Duplication Report

**Generated:** 2026-05-02 | Phase 2 synthesis from within-feature + cross-feature agents

---

## D1 — Two Content Fetch Hooks (`useContentGen` vs `useStageContent`)
**Type:** Cross-feature / Version drift  
**Severity:** HIGH — active architectural bifurcation

Both hooks fetch learning content for the same learning flow but use different strategies:

| Aspect | `useContentGen` | `useStageContent` |
|--------|-----------------|-------------------|
| Service call | `callLLM()` direct | `requestQueue.add()` + `fetch` |
| Cache API | `cacheGet/cacheSet` wrappers | `contentCache.get/set` object |
| certId | hardcoded `'ccxp'` | parameter |
| Fallback | domain-specific static content | error propagates |
| Concurrency | none | queue (max 2, 500ms) |

**Evidence:**
- `src/hooks/useContentGen.ts:66–171` — 4 loaders (overview, topics, flashcards, quiz), CCXP-only
- `src/hooks/useStageContent.ts:15–90` — 1 generic loader for any stage/cert

**Why they diverged:** `useContentGen` is legacy, predates multi-cert. `useStageContent` is the newer pattern, introduced with the multi-cert refactor. Neither was deleted during the transition.

**Legitimate specialization?** No. `useStageContent` is strictly better: it's cert-generic, uses the request queue, and uses the clean contentCache API. `useContentGen` should be deprecated and its call sites migrated.

---

## D2 — Response Parsing Duplicated (`extractArray` vs `parseQuestions`)
**Type:** Within-feature  
**Severity:** MEDIUM

Both content hooks independently implement LLM response JSON extraction — stripping markdown backticks, handling `{data: [...]}` wrappers, recursing into `{content: "..."}` shapes.

**Evidence:**
- `src/hooks/useContentGen.ts:8–37` — `extractArray<T>()` function
- `src/hooks/useQuestionGen.ts:150–177` — `parseQuestions()` function

~80% identical logic. The only specialization in `parseQuestions` is injecting `id` and `domain` fields onto each question.

**Legitimate specialization?** No for the parsing core. The field injection is a 2-line addition that could sit on top of a shared parser.

---

## D3 — Legacy Migration Pattern (4 Files)
**Type:** Cross-feature  
**Severity:** MEDIUM — maintenance burden, one potential bug

Four files independently implement: detect old `ccxp_*` key → read → transform → write new key → return. Same try-catch + JSON.parse shell, different transforms.

**Evidence:**
- `src/store/historyStore.ts:7–27` — reads `ccxp_exam_history`, adds `certId: 'ccxp'`, writes `certpath_exam_history`
- `src/store/learnStore.ts:50–70` — reads `ccxp_learn_progress`, prefixes all dict keys with `ccxp::`, writes `certpath_learn_progress`
- `src/services/questionBank.ts:20–40` — reads `ccxp_question_bank`, adds `certId: 'ccxp'`, writes `certpath_question_bank`
- `src/services/contentCache.ts:11–36` — eager migration at module load, renames per-domain cache keys

**Why they diverged:** Each store was independently authored during the multi-cert migration; no shared migration utility was built.

**Legitimate specialization?** The migration *transforms* differ per store (different data shapes). The *shell* (try-catch + read-old + write-new) is identical and accidental. Also: `contentCache.ts:25` has a potential double-prefix bug — `'ccxp_' + key` where `key` already starts with `ccxp_`.

---

## D4 — Question Deduplication Key (5 Inline Copies)
**Type:** Within-feature  
**Severity:** LOW

Same substring(0, 60) magic number + `.trim().toLowerCase()` chain repeated 5 times in `useQuestionGen`.

**Evidence:**
- `src/hooks/useQuestionGen.ts:140` — validation batch
- `src/hooks/useQuestionGen.ts:214` — fallback check
- `src/hooks/useQuestionGen.ts:339–344` — batch dedup filter
- `src/hooks/useQuestionGen.ts:420–425` — gap-fill dedup filter
- `src/hooks/useQuestionGen.ts:438–443` — final dedup pass

**Legitimate specialization?** No. All five compute the same key for the same purpose (deduplicate questions by text).

---

## D5 — Retry Loop Duplicated in `useQuestionGen`
**Type:** Within-feature  
**Severity:** LOW

Same 3-attempt retry-with-2s-delay control structure inlined twice in the same file.

**Evidence:**
- `src/hooks/useQuestionGen.ts:309–356` — main chunk retry
- `src/hooks/useQuestionGen.ts:406–433` — gap-fill retry

**Legitimate specialization?** No. Identical logic.

---

## D6 — Health Endpoint Double-Fetch on App Mount
**Type:** Cross-feature  
**Severity:** LOW — 1 extra HTTP request at cold start

Two components independently `fetch('/api/health')` with `[]` dependency (once on mount).

**Evidence:**
- `src/App.tsx:68` — `AnnouncementBanner` extracts `data.banner`
- `src/App.tsx:88` — `MaintenanceGate` extracts `data.maintenance`, `data.status`

Both are in `App.tsx`, rendered sibling-close. The worker endpoint (`worker/src/index.ts:409–431`) hits Groq + KV each call; no caching headers set.

**Legitimate specialization?** Marginally — they read different fields for different purposes. But they're so close in the component tree that sharing a single fetch would be trivial. Low priority given endpoint speed.

---

## D7 — `contentCache` Dual API Surface
**Type:** Within-feature  
**Severity:** LOW — API redundancy

`contentCache` exports both an object (`contentCache.get/set`) and standalone wrappers (`cacheGet/cacheSet`). The wrappers omit `domain`/`type` metadata.

**Evidence:**
- `src/services/contentCache.ts:123–127` — wrapper functions
- `src/hooks/useContentGen.ts` imports wrappers
- `src/hooks/useStageContent.ts` uses object API

**Legitimate specialization?** No. Incremental API drift. Wrappers exist only because `useContentGen` predates the richer object API.

---

## D8 — localStorage Init Pattern (8 Files)
**Type:** Cross-feature  
**Severity:** NONE — intentional idiom

`JSON.parse(localStorage.getItem(KEY) ?? '[]')` with try-catch appears in 8 files. This is the idiomatic Zustand + localStorage pattern. Extracting it to a utility would add abstraction with no functional benefit.

**Evidence:** `historyStore.ts:9`, `learnStore.ts:53`, `questionBank.ts:23`, `contentCache.ts:64`, `LandingPage.tsx:76`, `ComingSoonPage.tsx:24`, `StudyPlanPanel.tsx:24`, `tutorStore.ts:22`

**Action:** None. Accept as convention.

---

## D9 — JWT Handling (Client Parse vs Server Verify)
**Type:** Cross-feature  
**Severity:** NONE — correct architecture

Client `parseJwt()` (`auth.ts:19`) decodes payload for display only. Server `verifyJwt()` (`worker/src/index.ts:96`) cryptographically verifies signature. Different functions, different security contracts. Names are already clear.

**Action:** None.

---

## Prioritized Action List

| Priority | Item | Effort | Files Affected |
|----------|------|--------|----------------|
| **P1** | Deprecate `useContentGen`, migrate call sites to `useStageContent` (D1) | Medium | `useContentGen.ts`, all components importing it |
| **P2** | Extract shared LLM response parser (D2) | Small | `useContentGen.ts`, `useQuestionGen.ts` |
| **P3** | Audit + document legacy migration code; fix potential `contentCache` double-prefix bug (D3) | Small | `contentCache.ts:25` |
| **P4** | Extract `getQuestionKey()` utility (D4) | Trivial | `useQuestionGen.ts` |
| **P5** | Extract retry helper (D5) | Small | `useQuestionGen.ts` |
| **P6** | Merge health fetches into shared hook (D6) | Small | `App.tsx` |
| **P7** | Remove `cacheGet/cacheSet` wrappers after D1 migration (D7) | Trivial | `contentCache.ts`, `useContentGen.ts` |
