# 04 — Handoff Prompts for `/make-plan`

Copy any block below directly into `/make-plan` to generate a detailed implementation plan.

---

## Plan A — Retire `useContentGen`, unify on `useStageContent`
*(Addresses D1 + D7 from 02-duplication-report.md, implements U1 from 03-unified-proposal.md)*

```
Plan: Deprecate `useContentGen` and migrate all call sites to `useStageContent`.

Target: `src/hooks/useStageContent.ts` becomes the sole content fetch hook.

Context from PATHFINDER-2026-05-02/01-flowcharts/F4-learning-flow.md and F9-llm-infrastructure.md:
- `useContentGen` (src/hooks/useContentGen.ts:66-171) is CCXP-only (certId hardcoded), bypasses requestQueue, uses legacy cacheGet/cacheSet wrappers.
- `useStageContent` (src/hooks/useStageContent.ts:15-90) is cert-generic, uses requestQueue (max 2 concurrent, 500ms delay), uses contentCache object API.
- Both are currently in production — this is a migration, not a rewrite.

Call sites to rewrite (grep: `useContentGen\|useTopicsContent\|useOverviewContent\|useFlashcardContent\|useQuizContent`):
- Find all imports of `useContentGen` in src/components/Learn/ and migrate each to `useStageContent<T>(certId, domain, stageType)`.
- Type mapping: overview→'stage1-summary', topics→'stage2-concepts', quiz→'stage4-quiz'.
- Flashcard case: check src/components/Learn/FlashcardDeck.tsx — if it uses useContentGen, determine if a 'flashcards' stage type exists in the worker (worker/src/index.ts:606-960) or needs to be mapped to an existing type.

After all call sites migrated:
1. Delete src/hooks/useContentGen.ts.
2. Remove cacheGet/cacheSet wrapper functions from src/services/contentCache.ts:123-127.

Anti-pattern guards:
- Do NOT add a compatibility shim or re-export from useContentGen.ts.
- Do NOT keep both hooks active behind a feature flag.
- The fallback static content in useContentGen is maintenance burden — do NOT port it; a retry button is sufficient.
- Do NOT change useStageContent internals; only migrate call sites.
```

---

## Plan B — Extract shared LLM response parser
*(Addresses D2, implements U2)*

```
Plan: Extract shared LLM response JSON parsing into src/services/llm.ts.

Target: `src/services/llm.ts` gets an exported `extractJson<T>(raw, shape)` function.

Context from PATHFINDER-2026-05-02/02-duplication-report.md (D2):
- src/hooks/useContentGen.ts:8-37 has `extractArray<T>()` — strips markdown, handles {data:[]}, {content:""} shapes.
- src/hooks/useQuestionGen.ts:150-177 has `parseQuestions()` — same core logic + adds id/domain fields per question.
- ~80% identical. The only specialization in parseQuestions is a 2-line field injection after parsing.

Steps:
1. Read both functions in full.
2. In src/services/llm.ts, add `export function extractJson<T>(raw: unknown, shape: 'array' | 'object'): T | null` containing the shared strip-markdown + unwrap logic.
3. In useContentGen.ts: replace `extractArray(raw)` with `extractJson(raw, 'array')`.
4. In useQuestionGen.ts: replace the inline parsing block with `const parsed = extractJson<RawQuestion[]>(raw, 'array')`, then apply domain/id injection on the parsed result.

Anti-pattern guards:
- Do NOT import useContentGen from useQuestionGen or vice versa.
- Do NOT put question-specific logic (id injection, domain enrichment) inside extractJson — it must stay generic.
- llm.ts should remain a thin service layer, not a utility kitchen sink.
```

---

## Plan C — Single health fetch at App root
*(Addresses D6, implements U3)*

```
Plan: Consolidate the two /api/health fetches in App.tsx into one.

Target: src/App.tsx — single useEffect fetches /api/health, passes results to AnnouncementBanner and MaintenanceGate as props.

Context from PATHFINDER-2026-05-02/02-duplication-report.md (D6):
- src/App.tsx:68 — AnnouncementBanner fetches /api/health, reads data.banner.
- src/App.tsx:88 — MaintenanceGate fetches /api/health, reads data.maintenance + data.status.
- Both use [] dependency (run once on mount). Two requests, one response shape.
- Worker response shape (worker/src/index.ts:420-427): { status, groq, keyPrefix, keyLength, maintenance, banner, timestamp }.

Steps:
1. In App.tsx, add a HealthData type matching the worker response shape.
2. Add a single useEffect in the App() component (not inside child components) that fetches /api/health and stores result in useState<HealthData | null>.
3. Convert AnnouncementBanner to accept `banner: string | null` prop (remove its internal fetch).
4. Convert MaintenanceGate to accept `maintenance: boolean` prop (remove its internal fetch).
5. Pass health.banner and health.maintenance from App into the two components.

Anti-pattern guards:
- Do NOT create a React context or global store for health data — props are sufficient.
- Do NOT remove the null/undefined checks; health fetch can fail.
- Do NOT re-run the health fetch on auth state change; once-on-mount is correct.
- Keep the existing console.log for Groq key debugging (src/App.tsx:93) — just move it to the App-level effect.
```

---

## Plan D — `getQuestionKey()` utility + `withRetry()` helper in `useQuestionGen`
*(Addresses D4 + D5, implements U4)*

```
Plan: Extract two small helpers at the top of useQuestionGen.ts to eliminate 5 inline dedup key copies and 2 retry loop copies.

Target: src/hooks/useQuestionGen.ts — add two file-local helpers (no new files).

Context from PATHFINDER-2026-05-02/02-duplication-report.md (D4, D5):
- Dedup key: `.trim().toLowerCase().substring(0, 60)` appears at lines 140, 214, 339-344, 420-425, 438-443.
- Retry loop: 3-attempt + 2s delay structure appears at lines 309-356 (main chunk) and 406-433 (gap-fill).

Steps:
1. Add at top of useQuestionGen.ts (after imports):
   ```ts
   const DEDUP_KEY_LEN = 60
   const getQuestionKey = (q: Question | string) =>
     (typeof q === 'string' ? q : q.q).trim().toLowerCase().substring(0, DEDUP_KEY_LEN)

   async function withRetry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T | null> {
     for (let i = 0; i < attempts; i++) {
       try { return await fn() } catch {}
       if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs))
     }
     return null
   }
   ```
2. Replace all 5 inline dedup key computations with `getQuestionKey(q)`.
3. Replace both retry loops with `withRetry(async () => { ... }, CHUNK_RETRIES, RETRY_DELAY_MS)`.
4. Verify the seen set (Set<string>) usage is consistent with the new key function.

Anti-pattern guards:
- Do NOT export these helpers; they are file-local utilities.
- Do NOT move them to a shared service file — they only have one consumer.
- Do NOT change CHUNK_RETRIES or RETRY_DELAY_MS values — just reference existing constants.
```

---

## Plan E — Audit and document legacy migration code
*(Addresses D3, implements U5)*

```
Plan: Fix the potential double-prefix bug in contentCache.ts and add removal-condition comments to all 4 migration blocks.

Target files:
- src/services/contentCache.ts:11-36
- src/store/historyStore.ts:7-27
- src/store/learnStore.ts:50-70
- src/services/questionBank.ts:20-40

Context from PATHFINDER-2026-05-02/02-duplication-report.md (D3):
- All 4 files migrate from old ccxp_* keys to new certpath_* keys (or ccxp:: prefixed keys).
- contentCache.ts:25 potential bug: `const newKey = 'ccxp_' + key` where key already starts with ccxp_ (per the check on line 23). If key = 'ccxp_CX Strategy_topics', newKey = 'ccxp_ccxp_CX Strategy_topics'. Cross-check against useStageContent.ts:78 to confirm intended new key format.

Steps:
1. Read contentCache.ts:11-36 and useStageContent.ts:78 to determine the correct new key pattern.
2. If contentCache line 25 IS a bug: fix the newKey construction to match the correct pattern.
3. If it is NOT a bug (double-prefix is intended): add an explanatory comment.
4. Add this comment above each of the 4 migration blocks:
   // MIGRATION: Legacy CCXP-only → multi-cert format. Safe to remove once
   // certpath_* keys are universal (no user has ccxp_* keys remaining).
5. Do NOT merge the migration transforms into a shared utility — shapes differ and migration is one-time.

Anti-pattern guards:
- Do NOT remove the try-catch from any migration block.
- Do NOT change the migration logic itself (transforms are correct per their data shapes).
- Do NOT add a runtime check for "has migration run" — the try-new-key-first pattern is sufficient.
```
