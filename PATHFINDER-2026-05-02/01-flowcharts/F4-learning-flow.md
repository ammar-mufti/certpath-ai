# F4 — 4-Stage Progressive Learning Flow

**Entry points:** `src/pages/LearnPage.tsx:1`, `src/components/Learn/DomainPage.tsx:80`

```mermaid
flowchart TD
    Start["User navigates to /:certId/learn\nsrc/pages/LearnPage.tsx:10"] --> Home1["LearnHome renders\nsrc/components/Learn/LearnHome.tsx:16"]
    Home1 --> Home2["getCert for domain list\nsrc/components/Learn/LearnHome.tsx:18"]
    Home2 --> Home3["getDomainProgress for each\nsrc/components/Learn/LearnHome.tsx:32"]
    Home3 --> Home4["Display domain cards\nsrc/components/Learn/LearnHome.tsx:102"]
    Home4 --> DomainSelect["User clicks domain\nnavigate /:certId/learn/:domainSlug\nsrc/components/Learn/LearnHome.tsx:119"]

    subgraph Stage1["Stage 1 — Domain Snapshot"]
        S1Init["DomainPage mounts\nsrc/components/Learn/DomainPage.tsx:80"]
        S1Check["contentCache.get stage1-summary\nsrc/hooks/useStageContent.ts:28"]
        S1Cached{"Cache hit?"}
        S1Load["useStageContent.load\nsrc/components/Learn/DomainPage.tsx:144"]
        S1Queue["requestQueue.add\nsrc/services/requestQueue.ts:8"]
        S1Fetch["POST /api/llm {type:'stage1-summary'}\nsrc/hooks/useStageContent.ts:63"]
        S1Cache["contentCache.set\nsrc/hooks/useStageContent.ts:78\nkey: certId_domain_stage1-summary"]
        S1Render["Stage1Summary component\nsrc/components/Learn/DomainPage.tsx:232"]
        S1Init --> S1Check --> S1Cached
        S1Cached -->|Yes| S1Render
        S1Cached -->|No| S1Load --> S1Queue --> S1Fetch --> S1Cache --> S1Render
    end

    subgraph Stage2["Stage 2 — Key Concepts"]
        S2Trigger["useEffect: s1.data ready\nsrc/components/Learn/DomainPage.tsx:150"]
        S2Check["contentCache.get stage2-concepts\nsrc/hooks/useStageContent.ts:28"]
        S2Cached{"Cache hit?"}
        S2Load["useStageContent.load\nsrc/components/Learn/DomainPage.tsx:150"]
        S2Queue["requestQueue.add\nsrc/services/requestQueue.ts:8"]
        S2Fetch["POST /api/llm {type:'stage2-concepts'}\nsrc/hooks/useStageContent.ts:63"]
        S2Cache["contentCache.set\nsrc/hooks/useStageContent.ts:78\nkey: certId_domain_stage2-concepts"]
        S2Render["Stage2Concepts component\nsrc/components/Learn/DomainPage.tsx:248"]
        S2Trigger --> S2Check --> S2Cached
        S2Cached -->|Yes| S2Render
        S2Cached -->|No| S2Load --> S2Queue --> S2Fetch --> S2Cache --> S2Render
    end

    subgraph Stage3["Stage 3 — Deep Dive (per topic)"]
        S3User["User clicks 'Go Deeper'\nsrc/components/Learn/Stage2Concepts.tsx:121"]
        S3Check["contentCache.get stage3-deepdive\nsrc/hooks/useStageContent.ts:28\nkey includes topic slug"]
        S3Cached{"Cache hit?"}
        S3Load["useStageContent.load\nsrc/components/Learn/Stage2Concepts.tsx:56"]
        S3Queue["requestQueue.add\nsrc/services/requestQueue.ts:8"]
        S3Fetch["POST /api/llm {type:'stage3-deepdive'}\nsrc/hooks/useStageContent.ts:63"]
        S3Cache["contentCache.set\nsrc/hooks/useStageContent.ts:78\nkey: certId_domain_stage3_topicslug"]
        S3MarkRead["markTopicRead certId,domain,topic\nsrc/components/Learn/Stage2Concepts.tsx:45\nsrc/store/learnStore.ts:98"]
        S3Render["Stage3DeepDive component\nsrc/components/Learn/Stage2Concepts.tsx:155"]
        S3User --> S3Check --> S3Cached
        S3Cached -->|Yes| S3MarkRead
        S3Cached -->|No| S3Load --> S3Queue --> S3Fetch --> S3Cache --> S3MarkRead
        S3MarkRead --> S3Render
    end

    subgraph Stage4["Stage 4 — Quick Quiz"]
        S4Trigger["useEffect: s2.data ready\nsrc/components/Learn/DomainPage.tsx:154"]
        S4Check["contentCache.get stage4-quiz\nsrc/hooks/useStageContent.ts:28"]
        S4Cached{"Cache hit?"}
        S4Load["useStageContent.load\nsrc/components/Learn/DomainPage.tsx:154"]
        S4Queue["requestQueue.add\nsrc/services/requestQueue.ts:8"]
        S4Fetch["POST /api/llm {type:'stage4-quiz'}\nsrc/hooks/useStageContent.ts:63"]
        S4Cache["contentCache.set\nsrc/hooks/useStageContent.ts:78\nkey: certId_domain_stage4-quiz"]
        S4Render["Stage4Quiz\nsrc/components/Learn/DomainPage.tsx:265"]
        S4Answer["User selects answer\nsrc/components/Learn/Stage4Quiz.tsx:56"]
        S4Result["Show explanation\nsrc/components/Learn/Stage4Quiz.tsx:114"]
        S4Score["setQuizScore domain,score\nsrc/components/Learn/Stage4Quiz.tsx:68\nsrc/store/learnStore.ts:124"]
        S4Trigger --> S4Check --> S4Cached
        S4Cached -->|Yes| S4Render
        S4Cached -->|No| S4Load --> S4Queue --> S4Fetch --> S4Cache --> S4Render
        S4Render --> S4Answer --> S4Result --> S4Score
    end

    subgraph Fallback["Fallback Paths"]
        FB1["LLM fails\nsrc/hooks/useStageContent.ts:80"]
        FB2["Stage2: FALLBACK_TOPICS[domain]\nsrc/hooks/useContentGen.ts:111"]
        FB3["Stage4: 1-question generic quiz\nsrc/hooks/useContentGen.ts:151"]
        FB4["Stage1: Show error+retry\nsrc/components/Learn/DomainPage.tsx:231"]
    end

    DomainSelect --> Stage1
    Stage1 --> Stage2
    Stage2 --> Stage3
    Stage3 --> Stage4
    S1Fetch -.->|error| FB1
    S2Fetch -.->|error| FB2
    S4Fetch -.->|error| FB3
    S1Fetch -.->|stage1 error| FB4
```

## Progress Write Locations
| Action | File:Line | localStorage Key |
|--------|-----------|-----------------|
| Mark topic read | `learnStore.ts:98` | `certpath_learn_progress` |
| Set quiz score | `learnStore.ts:124` | `certpath_learn_progress` |
| Progress format | `learnStore.ts:77` | key: `${certId}::${domain}` |
| Save to storage | `learnStore.ts:72` | `certpath_learn_progress` |

## Worker Endpoints
- `POST /api/llm` with `type: 'stage1-summary'` → `worker/src/index.ts:649`
- `POST /api/llm` with `type: 'stage2-concepts'` → `worker/src/index.ts:686`
- `POST /api/llm` with `type: 'stage3-deepdive'` → `worker/src/index.ts:731`
- `POST /api/llm` with `type: 'stage4-quiz'` → `worker/src/index.ts:777`

## External Dependencies
- F9 (LLM Infrastructure): `requestQueue`, `contentCache`, `callLLM`
- `activityTracker.domainStudied()` — called at `DomainPage.tsx:145`
