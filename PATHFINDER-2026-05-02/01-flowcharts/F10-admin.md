# F10 — Admin Dashboard & Analytics

**Entry points:** `src/pages/AdminPage.tsx:1`, `worker/src/index.ts:435`

```mermaid
flowchart TD
    A["User navigates /admin\nApp.tsx:117"] --> B["ProtectedRoute\nsrc/components/Auth/ProtectedRoute.tsx"]
    B --> C["AdminRoute\nsrc/components/Admin/AdminRoute.tsx:4"]
    C --> D{"user.isAdmin?\nAdminRoute.tsx:6"}
    D -->|No| E["Navigate /dashboard\nAdminRoute.tsx:6"]
    D -->|Yes| F["AdminPage\nsrc/pages/AdminPage.tsx:145"]

    F --> G["useAuthStore: get token\nAdminPage.tsx:146"]
    G --> H["useEffect: fetch stats + settings\nAdminPage.tsx:159-174"]
    H --> J["GET /api/admin/stats\nAdminPage.tsx:164"]
    H --> K["GET /api/admin/settings\nAdminPage.tsx:165"]
    J --> L["Render 4 tabs\nAdminPage.tsx:239-244"]
    K --> L

    subgraph SettingsTab["Settings Tab"]
        ST1["Maintenance toggle\nAdminPage.tsx:463-468"]
        ST2["Banner input\nAdminPage.tsx:472-479"]
        ST3["Featured Cert input\nAdminPage.tsx:483-490"]
        ST4["Save button\nAdminPage.tsx:493-498"]
        ST5["saveSettings\nAdminPage.tsx:188-196"]
        ST6["POST /api/admin/settings\nAdminPage.tsx:189"]
        ST7["Show 'Saved!' feedback\nAdminPage.tsx:194"]
        ST1 --> ST5
        ST2 --> ST5
        ST3 --> ST5
        ST4 --> ST5
        ST5 --> ST6
        ST6 --> ST7
    end

    subgraph UsersTab["Users Tab"]
        UT1["Search input\nAdminPage.tsx:355"]
        UT2["Filter + paginate 20/page\nAdminPage.tsx:198-203"]
        UT3["User table\nAdminPage.tsx:365-396"]
        UT4["View → UserModal\nAdminPage.tsx:388"]
        UT5["Delete Account\nAdminPage.tsx:137"]
        UT6["deleteUser\nAdminPage.tsx:176-186"]
        UT7["DELETE /api/admin/users/:email\nAdminPage.tsx:177"]
        UT1 --> UT2 --> UT3 --> UT4 --> UT5 --> UT6 --> UT7
    end

    L --> SettingsTab
    L --> UsersTab

    subgraph MaintenanceGate["MaintenanceGate (App.tsx:82)"]
        MG1["useEffect: GET /api/health\nApp.tsx:87-96"]
        MG2{"maintenance = true\n+ !isAdmin?"}
        MG3["Show MaintenancePage\nApp.tsx:98"]
        MG4["Pass through app\nApp.tsx:99"]
        MG1 --> MG2
        MG2 -->|Yes| MG3
        MG2 -->|No| MG4
    end

    subgraph AnnouncementBanner["AnnouncementBanner (App.tsx:65)"]
        AB1["useEffect: GET /api/health\nApp.tsx:67-72"]
        AB2{"data.banner exists?"}
        AB3["Render gold banner\nApp.tsx:75-78"]
        AB4["Close → setBanner null\nApp.tsx:77"]
        AB1 --> AB2
        AB2 -->|Yes| AB3 --> AB4
    end

    subgraph WorkerEndpoints["Worker Endpoints"]
        WE1["GET /api/health\nworker/src/index.ts:409\nNO AUTH REQUIRED"]
        WE2["requireAdmin middleware\nworker/src/index.ts:39-46"]
        WE3["GET /api/admin/stats\nworker/src/index.ts:435"]
        WE4["GET /api/admin/settings\nworker/src/index.ts:563"]
        WE5["POST /api/admin/settings\nworker/src/index.ts:572"]
        WE6["DELETE /api/admin/users/:email\nworker/src/index.ts:540"]
        WE7["POST /api/admin/track\nworker/src/index.ts:501\nJWT required, NOT admin"]
        WE2 --> WE3
        WE2 --> WE4
        WE2 --> WE5
        WE2 --> WE6
    end

    J --> WE2
    K --> WE2
    ST6 --> WE2
    UT7 --> WE2
    MG1 --> WE1
    AB1 --> WE1

    ST6 --> WE5
    WE5 -->|KV.put settings_maintenance| SettingsKV["Cloudflare KV"]
    WE5 -->|KV.put settings_banner| SettingsKV
    WE5 -->|KV.put settings_featured_cert| SettingsKV
    WE1 -->|reads KV.get| SettingsKV
```

## Worker Auth Requirements
| Endpoint | Auth | Location |
|----------|------|----------|
| `GET /api/health` | None | `worker/src/index.ts:409` |
| `GET /api/admin/stats` | JWT + `isAdmin` | `worker/src/index.ts:435` |
| `GET /api/admin/settings` | JWT + `isAdmin` | `worker/src/index.ts:563` |
| `POST /api/admin/settings` | JWT + `isAdmin` | `worker/src/index.ts:572` |
| `DELETE /api/admin/users/:email` | JWT + `isAdmin` | `worker/src/index.ts:540` |
| `POST /api/admin/track` | JWT only | `worker/src/index.ts:501` |

## External Dependencies
- Cloudflare KV for settings persistence
- `useAuthStore` (F1): Bearer token for all admin requests
- `POST /api/admin/track` consumed by F6 (Results) and F4 (Learning)
