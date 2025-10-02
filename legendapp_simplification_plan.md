Phase 1: Configuration Refactoring and Simplification
This phase focuses on centralizing the Legend-State configuration to eliminate redundancy, as highlighted in both plans.
1. Centralize configureSynced:
Modify services/legendStateConfig.ts to ensure configureSynced is called only once. A good approach is to use a module-level variable to hold the configured plugin, ensuring it's initialized only one time.
This initial configuration should set up the global settings for Supabase integration, AsyncStorage persistence, retry mechanisms, and default field names (created_at, updated_at, etc.).
2. Create a Factory Function for Observables:
Refactor the createSyncedObservable function. It should no longer call configureSynced itself but should instead use the globally configured plugin created in the previous step.
This factory function will now only accept parameters that are specific to each data collection (like collection, actions, filter, etc.), simplifying its use.
3. Update Observable Creation:
Review stores/syncedObservables.ts and update all instances where observables are created to use the new, simplified createSyncedObservable factory function.
Ensure that the application's entry point or an initializer (like utils/appInitializer.ts) calls the main configuration function (configureLegendState) once at startup.
Phase 2: Consolidate React Hooks and Data Access
This phase streamlines how components access data by eliminating redundant hooks and standardizing on a single data hook.
1. Enhance the Combined useSyncedData Hook:
Focus on the main useSyncedData hook in hooks/useSyncedData.ts.
Implement proper tracking for loading and error states within this hook so that components can react to data fetching status.
2. Deprecate and Remove Individual Hooks:
Identify all components that are using individual data hooks (e.g., useCategories, useCreatures).
Refactor these components to use the consolidated useSyncedData hook for all their data needs.
Once all components have been updated, remove the now-unused individual hook files.
Phase 3: Eliminate Legacy Stores
This phase completes the transition to a modern state management approach by removing old code.
1. Replace Legacy Hook Usage:
Identify every component that still uses the old, Zustand-based store hooks (like useCatalogStore).
Replace these hooks with direct calls to the consolidated useSyncedData hook to fetch and interact with observable data.
2. Remove Abstraction Layers:
Eliminate any utility functions that were created to bridge the old and new systems, such as extractObservableValues. The goal is to use data from observables directly in the components.
3. Delete Old Store Files:
After confirming that no parts of the application rely on them, delete all legacy store files and directories.
Phase 4: Performance Optimization and Verification
This final phase focuses on refining the new implementation and ensuring its stability.
1. Audit and Optimize:
Review how observables are being used throughout the application to identify any performance bottlenecks.
Implement strategies like lazy loading for data that is not immediately required.
Optimize any data transformation logic to be as efficient as possible.
2. Thoroughly Test:
Run all existing unit and integration tests to catch any regressions.
Manually test all critical user workflows, paying close attention to data synchronization, offline capabilities, and persistence.
Benchmark performance before and after the changes to measure the impact on data access speed and memory usage.
3. Update Documentation:
Update all internal documentation to reflect the new, simplified architecture.
Create clear examples of how to use the useSyncedData hook and interact with observables.
Remove any documentation that refers to the old, legacy stores.
