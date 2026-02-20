# Squirrel — REPO MAP

> Structural map: folders + key files + 1-line purpose.

## Root

```
Squirrel/
  CLAUDE.md                          -- Project operating manual for Claude Code
  Docs/
    PROJECT_MAP.md                   -- Architecture overview (read first)
    REPO_MAP.md                      -- This file: structural map
  Squirrel-IOS/                      -- iOS app
  squirrel-backend/                  -- Firebase Cloud Functions
```

## squirrel-backend/

```
squirrel-backend/
  .firebaserc                        -- Firebase project alias (squirrel-348f6)
  firebase.json                      -- Firebase hosting/functions config
  functions/
    index.js                         -- Cloud Functions: gptPreflight, askGpt
    package.json                     -- Node.js 24, firebase-functions v7, firebase-admin v13.6
    package-lock.json                -- Dependency lockfile
```

## Squirrel-IOS/Squirrel/

```
Squirrel-IOS/Squirrel/
  .swiftlint.yml                     -- SwiftLint rules (force_unwrap=error, line_length=120)
  Podfile                            -- CocoaPods: FirebaseUI, Firestore, Storage, Functions, Analytics
  Podfile.lock                       -- Locked pod versions
  Squirrel.xcodeproj/                -- Xcode project (DO NOT MODIFY)
  Squirrel.xcworkspace/              -- Xcode workspace (DO NOT MODIFY)
  Pods/                              -- CocoaPods managed dependencies
  Squirrel/
    GoogleService-Info.plist         -- Firebase config (DO NOT COMMIT SECRETS)
    Info.plist                       -- App config (light mode, URL schemes, fonts, permissions)
    Assets.xcassets/                 -- Image assets, app icon, brand icons (43 asset sets)
    Rubik/                           -- Custom Rubik font files (14 static + 2 variable .ttf)
    Flows/                           -- All app source code (see below)
```

## Flows/ — Feature Modules

All paths below are relative to `Squirrel-IOS/Squirrel/Squirrel/Flows/`.

### Aplication/ — App lifecycle (note: intentionally misspelled)

```
Aplication/
  AppDelegate.swift                  -- Firebase + Facebook SDK init
  SceneDelegate.swift                -- Window setup, creates ApplicationCoordinator, notification delegate
  ApplicationCoordinator.swift       -- Root coordinator: auth check → auth flow OR main flow, post-login sync
  AppForegroundSync.swift            -- Triggers sync on app foreground
  AppLog.swift                       -- Tagged logging utility (info/warning/error)
  DeviceInfo.swift                   -- Device metadata helper (model, OS version)
  SplashViewController.swift         -- Initial splash screen (.xib)
  Base.lproj/
    LaunchScreen.storyboard          -- Launch screen
```

### LoginFlow/

```
LoginFlow/
  AuthCoordinator.swift              -- Auth flow coordinator (login → finishFlow callback)
  ViewControllers/
    AuthView.swift                   -- View protocol
    AuthViewController.swift         -- Login screen (Google + Apple buttons, .xib)
  ViewModels/
    AuthViewModel.swift              -- Auth logic, calls AuthRepository
```

### TabBarFlow/

```
TabBarFlow/
  TabbarCoordinator.swift            -- Creates 4 tab coordinators (Home, Checklist, Search, Profile)
  TabItemBaseCoordinator.swift       -- Base class for tab item coordinators
  ViewControllers/
    TabBarController.swift           -- Custom UITabBarController
    TabbarView.swift                 -- View protocol
  ViewModels/
    TabBarViewModel.swift            -- Tab bar configuration
```

### HomeFlow/

```
HomeFlow/
  HomeCoordinator.swift              -- Navigation: home → group → category → item; add item
  ViewControllers/
    HomeView.swift                   -- View protocol
    HomeViewController.swift         -- Dashboard: group list + expiration counters (.xib)
  ViewModels/
    HomeViewModel.swift              -- Groups data, expiration count logic
  Views/HomeCell/
    HomeTableViewCell.swift          -- Group row cell (.xib)
    ExpiredCountersTableViewCell.swift -- Expiration counter header (.xib)
```

### GroupFlow/

```
GroupFlow/
  ViewControllers/
    GroupView.swift                  -- View protocol
    GroupViewController.swift        -- Group detail: categories list (.xib)
  ViewModels/
    GroupViewModel.swift             -- Category list data for a group
  Views/CategoryCell/
    CategoryTableViewCell.swift      -- Category row cell (.xib)
```

### CategoryFlow/

```
CategoryFlow/
  ViewControllers/
    CategoryView.swift               -- View protocol
    CategoryViewController.swift     -- Category detail: items list (.xib)
  ViewModels/
    CategoryViewModel.swift          -- Item list data for a category
  Views/ItemCell/
    ItemTableViewCell.swift          -- Item row cell
```

### ItemFlow/

```
ItemFlow/
  ItemDetailsViewController.swift    -- UIKit host for SwiftUI item detail
  ItemDetailsView.swift              -- SwiftUI item detail view
  ItemDetailsViewModel.swift         -- Item detail logic (update/delete)
```

### AddItemFlow/

```
AddItemFlow/
  AddItem/
    ViewControllers/
      AddItemView.swift              -- View protocol
      AddItemViewController.swift    -- Main add/edit item form (table-based, .xib)
    ViewModels/
      AddItemViewModel.swift         -- Add item form logic, save/prefill
  AddItemSettings/
    Cells/
      AddItemOptionTableViewCell.swift -- Item type option cell (.xib)
    Models/
      AddItemOptionModel.swift       -- Item type option data model
    ViewController/
      AddItemSettingsView.swift      -- View protocol
      AddItemSettingsViewController.swift -- Item type picker (.xib)
    ViewModels/
      AddItemSettingsViewModel.swift -- Settings logic (OptionType, WeightUnit)
  DataScanner/
    BarcodeScannerView.swift         -- View protocol
    BarcodeScannerViewController.swift -- AVFoundation barcode scanner (.xib)
  NotesItem/
    NoteItemView.swift               -- View protocol
    NoteItemViewController.swift     -- OCR from document scanner (VisionKit, .xib)
    NoteItemViewModel.swift          -- Note OCR logic
  PhotoItem/
    MultiPhotoItemCaptureView.swift  -- View protocol
    MultiPhotoItemCaptureViewController.swift -- Multi-photo capture + OCR pipeline
    Cells/
      PhotoPreviewCell.swift         -- Photo thumbnail cell
    Models/
      OpenFoodFactsResponse.swift    -- OFF API response model
      PhotoAnalysisModel.swift       -- Photo analysis result model
    Services/
      AutofillPipeline.swift         -- Vision OCR + OpenFoodFacts + barcode analysis
      OpenFoodFactsService.swift     -- Barcode → product lookup via OFF API
    ViewModels/
      MultiPhotoItemCaptureViewModel.swift -- Photo capture + GPT autofill logic
  Views/
    AddBarCodeCell/                  -- Barcode input cell (.xib)
    AddItemHeaderView/               -- Form header view (.xib)
    AddNameItemCell/                 -- Name input cell (.xib)
    AmountCell/                      -- Count/amount cell (.xib)
    CategoryCell/                    -- Category picker cell (.xib)
    ExpirationDateCell/              -- Expiration date picker cell (.xib)
    GroupCollectionViewCell/         -- Group picker cell (.xib)
    NotesCell/                       -- Notes input cell (.xib)
    SaveItemCell/                    -- Save button cell (.xib)
    WeightItemCell/                  -- Weight input cell (.xib)
```

### AIFlow/

```
AIFlow/
  AIAccessGate.swift                 -- Single entry point for "can user start AI scan?" check
  AddItem/
    GPTItemAutofillService.swift     -- Builds GPT prompts, calls askGpt Cloud Function
    GPTUsageCache.swift              -- GPT usage cache (CachedUsage, TTL, period utils, preflight models)
```

### Alerts/

```
Alerts/
  AutofillDecisionAlertView.swift    -- SwiftUI alert for autofill accept/reject
```

### ChecklistFlow/

```
ChecklistFlow/
  CheckListCoordinator.swift         -- Checklist navigation coordinator
  Cells/
    ChecklistCell.swift              -- Checklist row cell
  CheckListModel/
    CheckListModel.swift             -- Checklist domain model
  ViewControllers/
    CheckListView.swift              -- SwiftUI checklist list view
    FloatingAddButton.swift          -- Floating action button component
  ViewModels/
    CheckListViewModel.swift         -- Checklist list logic (ObservableObject)
  CheckListDetails/
    CheckListDetailView.swift        -- SwiftUI checklist detail view
    Cells/
      ChecklistPointCell.swift       -- Checklist point row cell
    Models/
      ChecklistPointModel.swift      -- Checklist point model
    ViewModels/
      ChecklistDetailViewModel.swift -- Checklist detail logic
```

### SearchFlow/

```
SearchFlow/
  SearchCoordinator.swift            -- Search navigation (search → item detail, add item)
  Models/
    SearchMatch.swift                -- Search match result model (with relevance score)
    SearchSortType.swift             -- Sort enum (expirationDate, count, latestAdded, oldestAdded)
  ViewControllers/
    SearchView.swift                 -- View protocol
    SearchViewController.swift       -- Paginated fuzzy search with sort/filter (.xib)
  ViewModels/
    SearchViewModel.swift            -- Search logic, pagination, fuzzy matching, group filter
```

### MyProfileFlow/

```
MyProfileFlow/
  ProfileCoordinator.swift           -- Profile navigation (profile → subscriptions, support, delete)
  Helpers/
    EmailHelper.swift                -- Email composition helper
  ViewController/
    ProfileView.swift                -- SwiftUI profile screen
    DeleteAccountService.swift       -- Account deletion (Firebase + local wipe)
    SupportMailService.swift         -- Support email composition
  ViewModels/
    ProfileViewModel.swift           -- Profile screen logic (ObservableObject)
```

### NotificationFlow/

```
NotificationFlow/
  NotificationService.swift          -- Schedules grouped local notifications for expiration
  NotificationModels.swift           -- NotificationSettings, NotificationTiming models
  NotificationPermissionManager.swift -- System notification permission requests
  NotificationsBootstrapper.swift    -- First-launch notification setup
  ViewControllers/
    NotificationsSettingsView.swift  -- SwiftUI notification settings screen
  Views/
    NotificationsSettingsViewModel.swift -- Notification settings logic (ObservableObject)
```

### Subscriptions/ — Free/Pro tier gating + paywall UI

```
Subscriptions/
  UserAccessLevel.swift              -- Enum: free / pro + CachedAccessState struct
  SubscriptionsViewModel.swift       -- Paywall VM (ObservableObject), plan selection, subscribe() stub
  SubscriptionsView.swift            -- SwiftUI paywall screen (plan picker, premium ring animation)
  Services/
    UserAccessProvider.swift         -- Singleton; @Published access level, 24h offline TTL, UserDefaults cache
    UserAccessService.swift          -- Fetches isPro flag from Firestore users/{uid}
```

## Common/ — Shared Infrastructure

All paths relative to `Flows/Common/`.

### Protocols & Base Classes

```
Protocols/
  Coordinator.swift                  -- Coordinator protocol (start, child management)
  Presentable.swift                  -- Presentable protocol (toPresent → UIViewController)
  BaseView.swift                     -- BaseView protocol for view layer
  DeepLinkOption.swift               -- Deep link enum (login, createProduct)

Parent/
  BaseCoordinator.swift              -- Base coordinator with child add/remove lifecycle

Presenters/
  Router.swift                       -- Router protocol (push, pop, present, dismiss, setRoot)
  RouterImp.swift                    -- UINavigationController-based Router implementation
```

### Factories (Dependency Injection)

```
Factories/
  CoordinatorFactory.swift           -- Protocol: creates all coordinators
  CoordinatorFactoryImp.swift        -- Concrete coordinator factory
  ModuleFactoryImp.swift             -- Creates all VCs/VMs (conforms to all module factory protocols)
  ApplicationModuleFactory.swift     -- Protocol for app-level modules
  AuthModuleFactory.swift            -- Protocol for Auth modules
  HomeModuleFactory.swift            -- Protocol for Home modules
  SearchModuleFactory.swift          -- Protocol for Search modules
  CheckListModuleFactory.swift       -- Protocol for Checklist modules
  MyProfileModuleFactory.swift       -- Protocol for Profile modules
  TabBarCommonModuleFactory.swift    -- Protocol for TabBar modules
  AuthCoordinatorOutput.swift        -- Auth coordinator output protocol (finishFlow)
  TabBarItemOutput.swift             -- Tab item coordinator output protocol (onLogout)
```

### Style & Models

```
Style/
  UIColor.swift                      -- Brand color palette (SystemOrange primary, grays)
  StringConstants.swift              -- Centralized UI strings (titles, buttons, errors)

Models/
  CellIdentifiers.swift              -- Centralized cell reuse identifiers
  DefaultItemOption.swift            -- Default item option definitions
```

### Extensions

```
Extensions/
  Date+Extension.swift               -- Date formatting, relative time helpers
  String+SearchNormalization.swift   -- Unicode NFD normalization, diacritics removal
  UIApplication+Extension.swift      -- App-level utilities
  UIDevice+Extensions.swift          -- Device model, safe area helpers
  UIView+Gradient.swift              -- Gradient layer helpers
  UIViewController+hideKeyboar.swift -- Keyboard dismissal helper (note: misspelled filename)
  DispatchQueue+Extensions.swift     -- Main thread execution helper
```

### UI Components

```
CustomViews/
  Loader.swift                       -- Full-screen loading overlay (show/hide)

CustomLayout/
  LeftCollectionViewFlowLayout.swift -- Left-aligned collection view layout
  CustomLeftPaddingTextField.swift   -- Text field with custom left padding

ViewContollers/ (note: misspelled in codebase)
  SquirrelBaseTabBarController.swift -- Custom UITabBarController with branding
  SquirrelNavigationController.swift -- Custom UINavigationController (Rubik font, status bar)
```

### DataStores — Persistence Layer

```
DataStores/
  Models/
    StorageModel.swift               -- Domain models: StorageModel, GroupModel, CategoryModel, ItemModel + enums

  CoreData/
    CDSquirrelModel.xcdatamodeld/    -- CoreData schema (7 entities)
    CoreDataManager.swift            -- NSPersistentContainer singleton, context, wipe+recreate
    CoreDataStorageRepository.swift  -- Main CRUD repo (singleton): fetch, search, sync queue, notifications
    CoreDataChecklistRepository.swift -- Checklist CRUD repository
    StorageRepositoryProtocol.swift  -- Storage repository interface
    ChecklistRepositoryProtocol.swift -- Checklist repository interface
    ModelConverter.swift             -- CoreData ↔ domain model conversion (bidirectional)
    Models/
      CDItemModel+CoreDataClass.swift         -- Item entity class
      CDItemModel+CoreDataProperties.swift    -- Item entity properties
      CDCategoryModel+CoreDataClass.swift     -- Category entity class
      CDCategoryModel+CoreDataProperties.swift -- Category entity properties
      CDGroupModel+CoreDataClass.swift        -- Group entity class
      CDGroupModel+CoreDataProperties.swift   -- Group entity properties
      CDStorageModel+CoreDataClass.swift      -- Storage root entity class
      CDStorageModel+CoreDataProperties.swift -- Storage root entity properties
      CDSyncCommandModel+CoreDataClass.swift  -- Sync command entity class
      CDSyncCommandModel+CoreDataProperties.swift -- Sync command entity properties
      CDChecklistModel+CoreDataClass.swift    -- Checklist entity class
      CDChecklistModel+CoreDataProperties.swift -- Checklist entity properties
      CDChecklistItemModel+CoreDataClass.swift -- Checklist item entity class
      CDChecklistItemModel+CoreDataProperties.swift -- Checklist item entity properties

  Networking/
    AuthRepository.swift             -- Firebase Auth wrapper (Google + Apple sign-in, reauth)
    FirebaseStorageRepository.swift  -- Firestore CRUD (items/groups/categories), snapshot restore, incremental fetch
    FirebaseCloudDeletionService.swift -- Cloud soft-delete operations (batch, 450 per batch)
    FirebaseItemMapper.swift         -- Domain ↔ DTO conversion for items, groups, categories
    CloudSyncService.swift           -- Sync orchestrator (actor): restore/pull/push, throttling, coalescing
    SyncCursorStore.swift            -- Incremental sync cursor persistence (UserDefaults, per-collection)
    Models/
      FirebaseItemDTO.swift          -- Firebase DTOs (item, group, category) with schemaVersion + timestamps

  SyncStores/
    SyncCommand.swift                -- SyncCommandType enum (upsert/delete for item/group/category) + SyncCommandStatus
    SyncWorker.swift                 -- Processes sync command queue (actor): batch 20, retry with exponential backoff
    NetworkMonitor.swift             -- NWPathMonitor wrapper; triggers sync on reconnect
    AppEnvironment.swift             -- Shared mutable state (authRepository reference, currentUserID)

  UserDefault/
    UserDefaultStorage.swift         -- Selected group/category persistence
    UserDefaultsNotificationSettingsStore.swift -- Notification settings persistence (AppStorage)

  DefaultStorage/
    DefaultSeedSnapshot.swift        -- Hardcoded initial groups + categories for first launch
    InitialStorageBuilder.swift      -- Seeds CoreData with defaults

  ExportData/
    DataExportService.swift          -- JSON/CSV data export, CSV → PDF conversion
    PDFActivityItemSource.swift      -- Share sheet PDF source
```
