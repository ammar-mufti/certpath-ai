# F6 — Results & Study Plan

**Entry points:** `src/pages/ResultsPage.tsx:1`

```mermaid
flowchart TD
    A["ResultsPage\nsrc/pages/ResultsPage.tsx:13"] --> B["Guard: submitted?\nsrc/pages/ResultsPage.tsx:22"]
    B --> C["Score Calculation\nsrc/pages/ResultsPage.tsx:28"]
    C --> D["buildDomainScores\nsrc/store/historyStore.ts:114"]

    A --> E["buildWrongQuestions\nsrc/store/examStore.ts:116"]
    E --> F["WrongQuestion[]\nsrc/store/examStore.ts:2"]

    C --> G["Create ExamAttempt\nid+date+mode+certId\nsrc/pages/ResultsPage.tsx:32"]
    F --> G
    D --> G

    G --> H["addAttempt\nsrc/store/historyStore.ts:45"]
    H --> I["localStorage certpath_exam_history\nsrc/store/historyStore.ts:30"]

    A --> J["activityTracker.examCompleted\nsrc/services/activityTracker.ts"]

    A --> K["ScoreRing\nsrc/components/Results/ScoreRing.tsx:6"]
    K --> L["pass/fail: pct >= 70\nsrc/components/Results/ScoreRing.tsx:8"]

    A --> M["DomainBreakdown\nsrc/components/Results/DomainBreakdown.tsx:9"]
    M --> N["per-domain correct/total/%\nsrc/components/Results/DomainBreakdown.tsx:12"]
    N --> O["DOMAIN_COLORS map\nsrc/store/examStore.ts:181"]

    A --> P["StudyPlan\nsrc/components/Results/StudyPlan.tsx:15"]
    P --> Q["Identify weakDomains: lowest 3\nsrc/components/Results/StudyPlan.tsx:22"]
    Q --> R["POST /api/llm {type:'study-plan'}\nworker/src/index.ts:913"]
    R --> S["Tip[] domain+tips\nsrc/components/Results/StudyPlan.tsx:16"]
    S -->|error| U["Fallback generic tips\nsrc/components/Results/StudyPlan.tsx:51"]
    P -->|goStudy| V["navigate to /:certId/learn/:domain"]

    A --> W["WrongAnswers\nsrc/components/Results/WrongAnswers.tsx:13"]
    W --> X["Wrong Question Cards\nsrc/components/Results/WrongAnswers.tsx:40"]
    X --> Y["sessionStorage ccxp_navigate_to_topic\nsrc/components/Results/WrongAnswers.tsx:28"]
    X --> Z["Navigate to learn domain"]

    A --> AA["CTA Buttons\nsrc/pages/ResultsPage.tsx:79"]
    AA -->|New Exam| AB["resetExam + navigate config\nsrc/pages/ResultsPage.tsx:81"]
    AB -->|clears| AE["examStore mode+questions+answers\nsrc/store/examStore.ts:99"]
    AE -->|sessionStorage.removeItem| AF["certpath_exam_session\nsrc/store/examStore.ts:101"]
```

## Exam History Write Path
1. `ResultsPage.tsx:47` → `historyStore.getState().addAttempt(attempt)`
2. Score calculated at `ResultsPage.tsx:28–30`
3. Store action: `historyStore.ts:48–52`
4. Persistence: `historyStore.ts:30` → `localStorage['certpath_exam_history']`

## sessionStorage Keys (Legacy)
| Key | Location |
|-----|----------|
| `ccxp_navigate_to_topic` | `WrongAnswers.tsx:28` — legacy, navigate wrong answer → learn |

## External Dependencies
- F5 (Exam Engine): reads `examStore` for questions/answers
- F8 (Exam History): `addAttempt` → `historyStore`
- F9 (LLM Infrastructure): worker `/api/llm` `study-plan` endpoint
- F12 (Activity Tracking): `activityTracker.examCompleted()`
