# F2+F3 — Cert Registry & Dashboard

**Entry points:** `src/data/certifications.ts:1`, `src/pages/Dashboard.tsx:1`, `src/App.tsx:42–63`

```mermaid
flowchart TD
    A["Load App\nApp.tsx:102-142"] --> B["Init Auth Store\nApp.tsx:103-104"]
    B --> C{"User Authenticated?\nauthStore.user"}

    C -->|No| D["LandingPage\nsrc/pages/LandingPage.tsx:122-264"]
    C -->|Yes| E["Dashboard\nsrc/pages/Dashboard.tsx:87-151"]

    D --> D1["AVAILABLE_CERTS\ncertifications.ts:242"]
    D --> D2["COMING_SOON_CERTS\ncertifications.ts:243"]
    D1 --> D3["CertCard onClick\nsrc/pages/LandingPage.tsx:25-64"]
    D2 --> D4["ComingSoonCard waitlist\nsrc/pages/LandingPage.tsx:67-119"]
    D3 --> D5["handleStart cert\nsrc/pages/LandingPage.tsx:126-132"]
    D5 --> D6["Navigate /:certId/learn\nsrc/pages/LandingPage.tsx:128"]
    D4 --> D7["localStorage certpath_waitlist\nsrc/pages/LandingPage.tsx:75-78"]

    E --> E1["AVAILABLE_CERTS\ncertifications.ts:242"]
    E --> E2["COMING_SOON_CERTS\ncertifications.ts:243"]
    E1 --> E3["Render CertCard\nsrc/pages/Dashboard.tsx:32-72"]
    E2 --> E4["Render ComingSoonDashCard\nsrc/pages/Dashboard.tsx:74-85"]

    E3 --> E5["useLearnStore\nsrc/pages/Dashboard.tsx:34"]
    E5 --> E6["getDomainProgress certId, domain\nsrc/pages/Dashboard.tsx:34,37"]
    E6 --> E7["Calculate totalProgress %\nsrc/pages/Dashboard.tsx:36-38"]
    E7 --> E8["Render progress ring\nsrc/pages/Dashboard.tsx:19-29,57"]

    E3 --> E9["CertCard onClick\nsrc/pages/Dashboard.tsx:43-44"]
    E9 --> E11["Navigate /:certId/learn\nsrc/pages/Dashboard.tsx:44"]

    E --> E12["useHistoryStore\nsrc/pages/Dashboard.tsx:90"]
    E12 --> E13["Get recent attempts\nsrc/pages/Dashboard.tsx:92"]
    E13 --> E14["Render Recent Activity\nsrc/pages/Dashboard.tsx:118-146"]

    D6 --> F["Route: /:certId/learn\nApp.tsx:123"]
    E11 --> F

    F --> G["CertLearnPage\nsrc/App.tsx:42-48"]
    G --> G1["Extract certId from pathname\nsrc/App.tsx:43"]
    G1 --> G2["getCert certId\nsrc/App.tsx:44"]
    G2 --> G3{"Cert exists?\ncertifications.ts:245-246"}

    G3 -->|Not found| G4["Navigate /dashboard\nsrc/App.tsx:45"]
    G3 -->|Found| G5{"Check isAvailable\nsrc/App.tsx:46"}

    G5 -->|false| G6["Render ComingSoonPage\nsrc/App.tsx:46"]
    G5 -->|true| G7["Render LearnPage\nsrc/App.tsx:47"]

    G6 --> G6A["Show cert detail\nsrc/pages/ComingSoonPage.tsx:34-82"]
    G6A --> G6B["Email waitlist form\nsrc/pages/ComingSoonPage.tsx:56-72"]
    G6B --> G6C["localStorage certpath_waitlist\nsrc/pages/ComingSoonPage.tsx:23"]

    G7 --> G7A["LearnPage for certId\n(F4 — Learning Flow)"]
```

## Key Data Sources
- `isAvailable` flag: `src/data/certifications.ts:24` — single source of truth for availability
- `AVAILABLE_CERTS`: `certifications.ts:242` — filters `isAvailable === true`
- `COMING_SOON_CERTS`: `certifications.ts:243` — filters `isAvailable === false`
- Progress read from: `learnStore.getDomainProgress(certId, domain)` — `src/pages/Dashboard.tsx:34`
- Recent activity from: `historyStore.attempts` — `src/pages/Dashboard.tsx:90`

## External Dependencies
- `useLearnStore` (F4 — Learning Progress)
- `useHistoryStore` (F8 — Exam History)
- `useAuthStore` (F1 — Auth)
- `localStorage['certpath_waitlist']` — waitlist email persistence
