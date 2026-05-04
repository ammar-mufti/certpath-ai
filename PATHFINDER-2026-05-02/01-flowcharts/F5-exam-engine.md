# F5 — Exam Engine (Mode + Timer + Question Generation)

**Entry points:** `src/pages/ExamPage.tsx:1`, `src/components/Exam/ConfigScreen.tsx:179`

```mermaid
flowchart TD
    A["ConfigScreen\nsrc/components/Exam/ConfigScreen.tsx:179"]
    A -->|retake path| B["RetakePanel\nsrc/components/Exam/ConfigScreen.tsx:25"]
    A -->|generate path| C["GeneratePanel\nsrc/components/Exam/ConfigScreen.tsx:106"]

    B -->|setMode + setQuestions| D["ActiveExam\nsrc/pages/ExamPage.tsx:18"]

    C -->|setMode full/mini/domain| E["LoadingScreen\nsrc/components/Exam/LoadingScreen.tsx:13"]
    E --> F["useQuestionGen.generateForMode\nsrc/hooks/useQuestionGen.ts:235"]
    F --> G["buildPrompt domain weights\nsrc/hooks/useQuestionGen.ts:89"]
    G --> H["POST /api/llm {type:'generate-questions'}\nworker/src/index.ts:893"]
    H -->|parsed JSON| F
    F -->|fisherYates shuffle + dedup| I["Questions ready\nsrc/hooks/useQuestionGen.ts:437"]
    I -->|questionBank.save| J["localStorage certpath_question_bank\nsrc/services/questionBank.ts:47"]
    I -->|setQuestions| K["examStore.questions\nsrc/store/examStore.ts:25"]
    F -->|LLM fail| L["Fallback CCXP pool\nsrc/hooks/useQuestionGen.ts:189"]
    L --> K

    K --> D

    D --> O["useTimer init duration\nsrc/hooks/useTimer.ts:18"]
    O --> P["sessionStorage certpath_timer_seconds\nsrc/hooks/useTimer.ts:28"]
    O -->|onExpire| Q["Auto-submit exam"]
    O -->|persist every 10s| P

    D --> R["QuestionCard\nsrc/components/Exam/QuestionCard.tsx:27"]
    R -->|onAnswer| S["answerQuestion\nsrc/store/examStore.ts:86"]
    S --> T["examStore.answers Record<id,answer>\nsrc/store/examStore.ts:25"]

    R -->|selectedAnswer trigger| U["fetchExplanation\nsrc/components/Exam/QuestionCard.tsx:38"]
    U --> V["POST /api/llm {type:'explain-question'}\nworker/src/index.ts:863"]
    V --> X["examStore.explanations\nsrc/store/examStore.ts:32"]

    D --> Y["NavigationBar\nsrc/components/Exam/NavigationBar.tsx:8"]
    Y -->|navigateTo| Z["examStore.currentIndex\nsrc/store/examStore.ts:27"]
    Y -->|onSubmit| AA["SubmitModal\nsrc/components/Exam/SubmitModal.tsx:8"]
    AA -->|onConfirm| AB["confirm handler\nsrc/pages/ExamPage.tsx:48"]

    Q --> AB
    AB -->|stop timer| AC["timer.stop\nsrc/hooks/useTimer.ts:52"]
    AB -->|submitExam| AD["examStore.submitted = true\nsrc/store/examStore.ts:94"]
    AD -->|sessionStorage.removeItem| AE["certpath_exam_session cleared\nsrc/store/examStore.ts:96"]
    AB -->|navigate| AF["ResultsPage\n(F6 — Results)"]
```

## sessionStorage Keys
| Key | Location | Purpose |
|-----|----------|---------|
| `certpath_timer_seconds` | `useTimer.ts:28,42` | Countdown persistence (10s intervals) |
| `certpath_exam_session` | `examStore.ts:96,101` | Session marker; cleared on submit/reset |
| `certpath_retake_set_id` | `ConfigScreen.tsx:35,37` | Pre-select saved question set for retake |
| `certpath_navigate_to_topic` | `QuestionCard.tsx:65` | Navigation context exam→learn |

## localStorage Keys
| Key | Location | Purpose |
|-----|----------|---------|
| `certpath_question_bank` | `questionBank.ts:23,43` | Saved question sets for retakes |

## External Dependencies
- F9 (LLM Infrastructure): worker `/api/llm` for question generation and explanation
- F6 (Results): navigation target after submit
- `src/data/certifications.ts`: `getCert()` for domain weights
