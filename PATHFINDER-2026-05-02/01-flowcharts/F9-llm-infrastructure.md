# F9 — LLM Infrastructure

**Entry points:** `src/services/groq.ts:1`, `worker/src/index.ts:606`

```mermaid
flowchart TD
    subgraph Frontend["Frontend"]
        UCG["useContentGen\nsrc/hooks/useContentGen.ts"]
        USC["useStageContent\nsrc/hooks/useStageContent.ts:15"]
        CC_GET["contentCache.get\nsrc/services/contentCache.ts:39"]
        CC_SET["contentCache.set\nsrc/services/contentCache.ts:54"]
        RQ["requestQueue.add\nsrc/services/requestQueue.ts:8\nmax 2 concurrent, 500ms min"]
        CALLLLM["callLLM\nsrc/services/groq.ts:15"]
        OB["OfflineBanner\nsrc/App.tsx:19-34"]
    end

    subgraph Worker["Cloudflare Worker"]
        JWT_CHECK["verifyJwt\nworker/src/index.ts:96-115"]
        LLM_DISPATCH["LLM Dispatcher\nworker/src/index.ts:606-647"]
        S1H["stage1-summary\nworker/src/index.ts:649"]
        S2H["stage2-concepts\nworker/src/index.ts:686"]
        S3H["stage3-deepdive\nworker/src/index.ts:731"]
        S4H["stage4-quiz\nworker/src/index.ts:777"]
        TUTOR_H["tutor-chat\nworker/src/index.ts:807"]
        EXPLAIN_H["explain-question\nworker/src/index.ts:863"]
        GENQ_H["generate-questions\nworker/src/index.ts:894"]
        STUDYPLAN_H["study-plan\nworker/src/index.ts:913"]
        CASCADE["Groq Model Cascade\nworker/src/index.ts:143-200"]
        M1["llama-3.3-70b-versatile"]
        M2["llama-3.1-8b-instant\nwait: 2s on retry"]
        M3["mixtral-8x7b-32768\nwait: 4s on retry"]
    end

    UCG --> CC_GET
    USC --> CC_GET
    CC_GET -->|hit| CachedData["Serve from cache"]
    CC_GET -->|miss| RQ
    RQ --> CALLLLM
    CALLLLM -->|POST /api/llm\nBearer token| JWT_CHECK
    JWT_CHECK --> LLM_DISPATCH
    LLM_DISPATCH --> S1H
    LLM_DISPATCH --> S2H
    LLM_DISPATCH --> S3H
    LLM_DISPATCH --> S4H
    LLM_DISPATCH --> TUTOR_H
    LLM_DISPATCH --> EXPLAIN_H
    LLM_DISPATCH --> GENQ_H
    LLM_DISPATCH --> STUDYPLAN_H
    S1H --> CASCADE
    S2H --> CASCADE
    S3H --> CASCADE
    S4H --> CASCADE
    TUTOR_H --> CASCADE
    EXPLAIN_H --> CASCADE
    GENQ_H --> CASCADE
    STUDYPLAN_H --> CASCADE
    CASCADE --> M1
    M1 -->|ok| RESP["Return jsonRes"]
    M1 -->|fail| M2
    M2 -->|ok| RESP
    M2 -->|fail| M3
    M3 -->|ok| RESP
    M3 -->|all fail| ERR["Error: All Groq models failed"]
    RESP --> CC_SET
    CC_SET --> LS["localStorage.setItem"]
    OB -.->|navigator.onLine=false| OfflinePath["Show cached content"]
```

## localStorage Keys Written by contentCache
| Key Pattern | Set By | Notes |
|------------|--------|-------|
| `ccxp_ccxp_overview` | `useContentGen.ts:87` | Legacy domain overview |
| `ccxp_ccxp_topics` | `useContentGen.ts:106` | Legacy topic content |
| `ccxp_ccxp_flashcards` | `useContentGen.ts:133` | Legacy flashcards |
| `ccxp_ccxp_quiz` | `useContentGen.ts:161` | Legacy quiz |
| `{certId}_{domain}_stage1-summary` | `useStageContent.ts:78` | Stage 1 content |
| `{certId}_{domain}_stage2-concepts` | `useStageContent.ts:78` | Stage 2 content |
| `{certId}_{domain}_stage3_{topicSlug}` | `useStageContent.ts:78` | Stage 3 per-topic |
| `{certId}_{domain}_stage4-quiz` | `useStageContent.ts:78` | Stage 4 quiz |

## Cache Eviction Policy
- On localStorage quota hit: evict oldest 3 entries matching `*_stage*`
- Defined at: `contentCache.ts:59–75`

## Model Cascade Order
1. `llama-3.3-70b-versatile` (primary, `worker/src/index.ts:143`)
2. `llama-3.1-8b-instant` (fallback 1, wait 2s)
3. `mixtral-8x7b-32768` (fallback 2, wait 4s)
- Break immediately on 401/403 (invalid key)
- Continue on 429, 400, 5xx
