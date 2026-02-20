# Squirrel — PROJECT MAP

> Inventory management iOS app + Firebase backend.
> Users organize items (products, liquids, medicines, other) with barcode scanning, OCR, AI autofill, expiration tracking, checklists, and cloud sync.

## Tech Stack

| Layer | Stack |
|-------|-------|
| iOS | Swift 5, iOS 17+, UIKit (some SwiftUI), CocoaPods |
| Local DB | CoreData (`CDSquirrelModel`) |
| Cloud | Firebase: Auth, Firestore, Storage, Functions, Analytics |
| Auth | Google Sign-In, Apple Sign-In (via FirebaseUI) |
| Backend | Node.js 24, firebase-functions v7, OpenAI gpt-4o-mini |
| Lint | SwiftLint (`.swiftlint.yml` in `Squirrel-IOS/Squirrel/`) |
| Firebase project | `squirrel-348f6` |

## Architecture (iOS) — MVVM-C

```
AppDelegate (Firebase init)
  └─ SceneDelegate (window, creates ApplicationCoordinator)
       └─ ApplicationCoordinator (checks auth state)
            ├─ AuthCoordinator → AuthViewController/ViewModel (Google + Apple)
            └─ TabbarCoordinator (4 tabs)
                 ├─ HomeCoordinator     → HomeVC/VM (groups, expiration counters)
                 ├─ CheckListCoordinator → CheckListView/VM (SwiftUI)
                 ├─ SearchCoordinator   → SearchVC/VM (paginated fuzzy search)
                 └─ ProfileCoordinator  → ProfileView/VM (SwiftUI)
```

**Pattern**: Each flow lives in `Flows/<FlowName>/` with subdirs for ViewControllers, ViewModels, Views (cells), Models.

**DI**: `CoordinatorFactory` protocol → `CoordinatorFactoryImp`. `ModuleFactoryImp` creates all VCs/VMs. Per-module factory protocols in `Factories/`.

## Data Layer

### Domain Models
`Common/DataStores/Models/StorageModel.swift` — defines `StorageModel`, `GroupModel`, `CategoryModel`, `ItemModel`, plus enums: `GroupType`, `WeightUnit`, `ShelfLifeUnit`, `ExpirationDateType`, `OptionType`.

### CoreData (offline-first)
- **Schema**: `CDSquirrelModel.xcdatamodeld` — entities: CDItemModel, CDCategoryModel, CDGroupModel, CDStorageModel, CDSyncCommandModel, CDChecklistModel, CDChecklistItemModel.
- **CoreDataStorageRepository** (singleton) — full CRUD, paginated fuzzy search, sync command queue, notification scheduling, initial seed.
- **CoreDataChecklistRepository** — CRUD for checklists.
- **ModelConverter** — bidirectional CoreData ↔ domain model conversion.
- **Protocols**: `StorageRepositoryProtocol`, `ChecklistRepositoryProtocol`.

### Firebase (cloud)
- **Firestore collections**: `users/{uid}/items`, `users/{uid}/groups`, `users/{uid}/categories`, root `gptUsage`.
- **FirebaseStorageRepository** — cloud CRUD with soft-delete, snapshot restore, incremental fetch.
- **FirebaseItemDTO** — DTOs with `schemaVersion` and timestamps. `FirebaseItemMapper` converts domain ↔ DTO.
- **AuthRepository** — wraps Firebase Auth (Google + Apple).

### Sync Architecture
```
CloudSyncService (actor, orchestrator)
  ├─ SyncWorker (actor, processes SyncCommand queue from CoreData)
  ├─ SyncCursorStore (UserDefaults, incremental cursors per collection)
  ├─ NetworkMonitor (NWPathMonitor, triggers sync on reconnect)
  └─ AppForegroundSync (re-syncs on app foreground)
```
Full restore if all cursors zero; incremental pull otherwise. Local mutations enqueue SyncCommands → SyncWorker pushes to Firebase.

## Key Flows

| Flow | Purpose | Key files |
|------|---------|-----------|
| **AIFlow** | GPT autofill for item fields | `GPTItemAutofillService`, `AIAccessGate`, `GPTUsageCache` |
| **AddItemFlow** | Create/edit items (barcode, OCR, photo) | `AddItemVC/VM`, `BarcodeScannerVC`, `MultiPhotoItemCaptureVC/VM`, `AutofillPipeline`, `OpenFoodFactsService`, `NoteItemVC/VM` |
| **HomeFlow** | Dashboard: group list + expiration counters | `HomeCoordinator`, `HomeVC/VM` |
| **ChecklistFlow** | Shopping/todo checklists (SwiftUI) | `CheckListCoordinator`, `CheckListView/VM`, `ChecklistDetailVM` |
| **SearchFlow** | Paginated fuzzy search with sort/filter | `SearchCoordinator`, `SearchVC/VM`, `SearchMatch`, `SearchSortType` |
| **GroupFlow** | Group detail → category list | `GroupVC/VM` |
| **CategoryFlow** | Category detail → item list | `CategoryVC/VM` |
| **ItemFlow** | Item detail (SwiftUI hosted in UIKit) | `ItemDetailsVC`, `ItemDetailsView`, `ItemDetailsVM` |
| **LoginFlow** | Auth screen (Google + Apple) | `AuthCoordinator`, `AuthVC/VM` |
| **MyProfileFlow** | Profile, delete account, support | `ProfileCoordinator`, `ProfileView/VM`, `DeleteAccountService` |
| **NotificationFlow** | Expiration notification scheduling | `NotificationService`, `NotificationPermissionManager`, `NotificationsBootstrapper` |
| **TabBarFlow** | 4-tab container | `TabbarCoordinator`, `TabBarController` |
| **Subscriptions** | Free/Pro tier gating + paywall UI | `UserAccessProvider`, `UserAccessService`, `UserAccessLevel`, `SubscriptionsView`, `SubscriptionsVM` |

## Item Types
- **Product / Liquid / Medicines**: name, barcode, groups, categories, count, weight, notes, expiration
- **Other**: name, groups, categories, count, notes (no barcode/weight/expiration)

## Backend (Cloud Functions)

`squirrel-backend/functions/index.js` — two callable functions:
- **gptPreflight()** — read-only usage check. Returns `{used, limit, isPro}`.
- **askGpt(messages)** — atomic quota reservation → OpenAI call → rollback on failure. Model: gpt-4o-mini. Free=3/month, Pro=1000/month.

Firestore: `users` (isPro flag), `gptUsage` (monthly counters by `YYYY-MM`).

## Conventions

- **SwiftLint**: `force_unwrap`=error, `implicitly_unwrapped`=error, line length 120 (URLs/comments/func decls exempt).
- **Colors**: SystemOrange primary (defined in `UIColor.swift`).
- **Light mode only** (set in Info.plist).
- **Font**: Rubik (14 static variants + 2 variable-weight files).
- **MVVM-C**: Every flow has a Coordinator. UIKit screens use VC+VM. SwiftUI screens (Checklist, Profile, ItemDetails, Notifications, Subscriptions) are hosted where needed.
- **Singletons**: `CoreDataStorageRepository.shared`, `CloudSyncService.shared`, `NetworkMonitor.shared`, `UserAccessProvider.shared`, `SyncCursorStore.shared`, `AppForegroundSync.shared`.
- **Strings**: Centralized in `StringConstants.swift`.
- **Cell identifiers**: Centralized in `CellIdentifiers.swift`.

## Where to Add X

| Task | Where |
|------|-------|
| New screen/flow | Create `Flows/<FlowName>/` with ViewControllers/, ViewModels/. Add module factory protocol in `Factories/`. Register in `ModuleFactoryImp`. Add coordinator in `CoordinatorFactoryImp`. Wire into parent coordinator. |
| StoreKit purchase service | `Flows/Subscriptions/Services/` |
| New domain model field | `StorageModel.swift` → CD schema → CD model files → `ModelConverter` → `FirebaseItemDTO` → `FirebaseItemMapper` |
| New CoreData entity | CD schema → generate Class+Properties in `DataStores/CoreData/Models/` → add to repository |
| New Firebase collection | `FirebaseStorageRepository` or new repo in `DataStores/Networking/` |
| New Cloud Function | `squirrel-backend/functions/index.js` |
| New item form cell | Cell in `AddItemFlow/Views/<CellName>/` → register in `AddItemViewController` |
| New extension | `Common/Extensions/` |
| New shared UI component | `Common/CustomViews/` |
| New notification setting | `NotificationModels.swift` + `UserDefaultsNotificationSettingsStore.swift` |

## Changelog

- **2026-02-20** — Home: added third floating button (barcode scan), AI button labeled "AI", and barcode scan now uses OpenFoodFacts with existing-item decision.
- **2026-02-20** — AddItem barcode scan now auto-fills from OpenFoodFacts when possible, without AI gating.
- **2026-02-18** — Redesigned SubscriptionsView: added `PaywallTrigger` context (category/checklist/AI limit), contextual orange banner on free paywall, clean Pro state (no big button, manage subscription link). Replaced all UIAlert paywalls with full SubscriptionsView in HomeCoordinator and CheckListCoordinator.
- **2026-02-18** — Added free-tier checklist limit: max 3 checklists for free users. Gate in `CheckListCoordinator.showAddChecklist()`. Paywall alert on limit.
- **2026-02-18** — Added free-tier category limit: max 5 categories per group for free users (2 default + 3 user-created). Gate in `HomeCoordinator` before `showCreateCategory()`, covers both GroupFlow and AddItemFlow. Paywall alert on limit.
- **2026-02-18** — Reorganized subscription files: consolidated `Flows/UserAccess/` and `Flows/Common/Subscriptions/` into single `Flows/Subscriptions/` with `Services/` sublayer. No code changes.
- **2026-02-17** — Subscription/GPT audit refactor:
  - Created `AIAccessGate` — single entry point for scan eligibility check.
  - Extracted `GPTUsageCache.swift` from oversized `GPTItemAutofillService`.
  - Fixed error classification in `HomeCoordinator.showScanItem()` (network vs other).
  - Fixed logout not clearing GPT usage cache (`UserAccessProvider.reset()`).
  - Added foreground refresh for Pro status (`AppForegroundSync`).
  - Removed dead `GptUsageStatusService`, dead `PlanRow.swift`.
- **2026-02-17** — Created PROJECT_MAP.md and REPO_MAP.md (initial documentation).
