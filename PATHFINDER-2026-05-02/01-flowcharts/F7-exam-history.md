# F7 — Exam History & Analytics

**Entry points:** `src/pages/HistoryPage.tsx:206`, `src/store/historyStore.ts:7`

```mermaid
flowchart TD
    A["HistoryPage props: certId\nsrc/pages/HistoryPage.tsx:206"] --> B["useHistoryStore\nsrc/pages/HistoryPage.tsx:4"]
    B --> C["load\nsrc/store/historyStore.ts:7"]
    C --> D["localStorage.getItem\ncertpath_exam_history\nsrc/store/historyStore.ts:9"]
    D -->|Not found| E["Check legacy key\nccxp_exam_history\nsrc/store/historyStore.ts:12"]
    E -->|Found| F["Migrate: add certId='ccxp'\nsrc/store/historyStore.ts:15-19"]
    F --> G["localStorage.setItem certpath_exam_history\nsrc/store/historyStore.ts:20"]
    D -->|Found| H["Parse JSON attempts\nsrc/store/historyStore.ts:10"]
    E -->|Not found| I["Return empty array\nsrc/store/historyStore.ts:23"]
    G --> J["attempts[] ExamAttempt\nsrc/store/historyStore.ts:46"]
    H --> J

    J --> K["Filter: a.certId === certId\nsrc/pages/HistoryPage.tsx:210"]
    K --> L{"Tab selection\nsrc/pages/HistoryPage.tsx:241"}

    L -->|records| M["StatsBanner\nsrc/pages/HistoryPage.tsx:251"]
    M --> N["getBestScore\nsrc/store/historyStore.ts:69-75"]
    M --> O["getLatestScore\nsrc/store/historyStore.ts:77-82"]
    M --> P["getAverageScore\nsrc/store/historyStore.ts:84-90"]

    K --> Q["AttemptCard per attempt\nsrc/pages/HistoryPage.tsx:30"]
    Q --> R["formatDate\nsrc/pages/HistoryPage.tsx:14"]
    Q --> S["Render score + domain breakdown"]

    K -->|empty| V["EmptyHistory\nsrc/components/History/EmptyHistory.tsx:1"]

    L -->|bank| T["QuestionBankTab\nsrc/pages/HistoryPage.tsx:101"]
    T --> U["questionBank.getAll by certId\nsrc/pages/HistoryPage.tsx:103"]
```

## Legacy Migration (Cross-Cutting Concern)
- Detected at `historyStore.ts:11–22`
- Old key `ccxp_exam_history` → migrates all records with `certId: 'ccxp'`
- One-time migration; writes to new `certpath_exam_history` key

## localStorage Keys
| Key | Location | Purpose |
|-----|----------|---------|
| `certpath_exam_history` | `historyStore.ts:9,30` | Current multi-cert exam history |
| `ccxp_exam_history` | `historyStore.ts:12` | Legacy CCXP-only history (read-then-migrate) |

## External Dependencies
- `src/services/questionBank.ts` — question bank tab reads saved sets
- `src/data/certifications.ts` — `getCert()` for cert name/icon/passing score
