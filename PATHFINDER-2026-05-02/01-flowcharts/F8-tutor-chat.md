# F8 — AI Tutor Chat

**Entry points:** `src/components/AI/TutorChat.tsx:1`, `worker/src/index.ts:807`

```mermaid
flowchart TD
    A["User types message\nsrc/components/AI/TutorChat.tsx:84"] --> B["send content\nsrc/components/AI/TutorChat.tsx:125"]
    B --> C["addMessage 'user'\nsrc/store/tutorStore.ts:34"]
    C --> D["sessionStorage.setItem ccxp_tutor_history\nsrc/store/tutorStore.ts:37"]
    B --> E["setLoading true\nsrc/components/AI/TutorChat.tsx:133"]
    B --> F["callWorker content\nsrc/components/AI/TutorChat.tsx:107"]

    F --> G["usePageContext\nsrc/components/AI/TutorChat.tsx:29"]
    G --> H["Extract certId+domain from pathname\nsrc/components/AI/TutorChat.tsx:34-37"]
    H --> I["Build context string\nsrc/components/AI/TutorChat.tsx:39-63"]

    F --> J["GET store.messages\nsrc/store/tutorStore.ts:9"]
    F --> K["POST /api/llm {type:'tutor-chat'}\nsrc/components/AI/TutorChat.tsx:108"]
    K --> L["Bearer token from useAuthStore\nsrc/components/AI/TutorChat.tsx:82"]

    K --> M["Worker: type===tutor-chat\nworker/src/index.ts:807"]
    M --> N["Build systemPrompt\nworker/src/index.ts:808"]
    M --> O["Slice last 10 messages\nworker/src/index.ts:810"]
    O --> P["groqMessages = system + messages\nworker/src/index.ts:811"]
    P --> Q["For each GROQ_MODELS\nworker/src/index.ts:816"]
    Q -->|"i>0: wait 2^i s"| R["Exponential backoff\nworker/src/index.ts:819"]
    Q --> S["POST api.groq.com/openai/v1/chat/completions\nworker/src/index.ts:824"]
    S --> T{"HTTP response\nworker/src/index.ts:830-842"}
    T -->|401/403| U["Return 500 invalid key\nworker/src/index.ts:830"]
    T -->|429| V["Continue loop\nworker/src/index.ts:834"]
    T -->|200 ok| W["Extract content\nworker/src/index.ts:844"]
    W --> X{"response.trim empty?\nworker/src/index.ts:846"}
    X -->|Non-empty| Y["Return jsonRes {response}\nworker/src/index.ts:859"]
    X -->|Empty| Z["Continue loop\nworker/src/index.ts:847"]
    Q -->|All fail| AA["Return 500\nworker/src/index.ts:856"]

    Y --> AB["addMessage 'assistant'\nsrc/components/AI/TutorChat.tsx:137"]
    AB --> AC["sessionStorage.setItem ccxp_tutor_history\nsrc/store/tutorStore.ts:37"]

    K -->|Error/timeout| AD["failedMessage = content\nsrc/components/AI/TutorChat.tsx:141"]
    AD --> AE["setTimeout 3s auto-retry\nsrc/components/AI/TutorChat.tsx:144"]
    AE --> AF["doRetry content\nsrc/components/AI/TutorChat.tsx:153"]
    AF -->|Success| AG["addMessage + clearFailedMessage\nsrc/components/AI/TutorChat.tsx:161"]
    AF -->|Fail| AH["Increment retryCount\nsrc/components/AI/TutorChat.tsx:166"]

    B -->|finally| AI["setLoading false\nsrc/components/AI/TutorChat.tsx:149"]
    AI --> AJ["Render messages\nsrc/components/AI/TutorChat.tsx:251"]
```

## Context Window Management
- Last 10 messages enforced at: `worker/src/index.ts:810` — `body.messages.slice(-10)`
- Session persisted in `sessionStorage['ccxp_tutor_history']` — not cleared until browser close

## sessionStorage Keys
| Key | Location | Purpose |
|-----|----------|---------|
| `ccxp_tutor_history` | `tutorStore.ts:37` | Chat session persistence across page nav |

## External Dependencies
- F9 (LLM Infrastructure): Groq model cascade via worker
- `useAuthStore` (F1): Bearer token
- `useExamStore` (F5): Exam context for page-aware responses
