# TODOs Plan for SeaVault Project

This document outlines the identified TODOs across various files in the SeaVault project and proposes a plan for their implementation.

## 1. screens/dive-sites/DiveSitesWithSync.tsx

*   **TODO: In a real implementation, we might want to force a sync**
    *   **Plan:** Replace the placeholder `setTimeout` with a call to `forceSyncAll()` from `utils/syncUtils.ts`. This will ensure that when the user pulls to refresh, the latest dive site data is fetched from the backend and synchronized with the local state.
*   **TODO: Replace with actual refreshing logic**
    *   **Plan:** Integrate the `forceSyncAll()` call within the `onRefresh` function. The `setRefreshing(false)` should be called after the `forceSyncAll()` operation completes, ideally using a `finally` block to ensure the refreshing indicator is hidden even if an error occurs.

## 2. screens/modal/creature-picker/index.tsx

*   **TODO: In a real implementation, we might want to force a sync**
    *   **Plan:** Similar to `DiveSitesWithSync.tsx`, replace the `setTimeout` in `handleRefresh` with a call to `forceSyncAll()` from `utils/syncUtils.ts` to ensure creature and category data is up-to-date.
*   **TODO: Replace with actual refreshing logic**
    *   **Plan:** Implement the `forceSyncAll()` call within the `handleRefresh` function, ensuring `setRefreshing(false)` is called upon completion.

## 3. screens/modal/explore/components/ExploreCreatureCard.tsx

*   **TODO: Display discovered status for creature card (check if the user has discovered this creature)**
    *   **Plan:** Modify the `ExploreCreatureCard` component to receive `userSightings` (or a derived `discoveredCreatureIds` set) as a prop. Use this information to determine if `creature.id` exists in the discovered list and set `isDiscovered` accordingly. This will likely involve passing this data down from a parent component that has access to `useSyncedData`.

## 4. screens/tabs/categories/index.tsx

*   **TODO: In a real implementation, we might want to force a sync**
    *   **Plan:** Replace the `setTimeout` in `handleRefresh` with a call to `forceSyncAll()` from `utils/syncUtils.ts` to ensure all relevant data (categories, creatures, sightings, wishlists, profile) is synchronized.
*   **TODO: Replace with actual refreshing logic**
    *   **Plan:** Integrate the `forceSyncAll()` call within the `handleRefresh` function, ensuring `setRefreshing(false)` is called upon completion.

## 5. screens/tabs/home/index.tsx

*   **TODO: Implement achievements in observables**
    *   **Plan:** This is a larger task. It involves defining an `achievements$` observable in `stores/syncedObservables.ts`, setting up its synchronization with the backend (e.g., Supabase), and then integrating it into the `useSyncedData` hook. Once available, the `catalog` object in `HomeScreen` should be updated to include `achievements`.
*   **TODO: Implement a separate function for leaderboard**
    *   **Plan:** Create a new service function (e.g., `getLeaderboardData` in `services/statsService.ts` or a new `leaderboardService.ts`) that fetches and processes leaderboard data. This function should ideally leverage `useSyncedData` or directly query the necessary observables to compile the leaderboard.
*   **TODO: Populate leaderboard data**
    *   **Plan:** Once the `getLeaderboardData` function is implemented, call it within the `loadData` function in `HomeScreen` and update the `leaderboard` state with the fetched data.
*   **TODO: In a real implementation, we might want to force a sync**
    *   **Plan:** Replace the `setTimeout` in `handleRefresh` with a call to `forceSyncAll()` from `utils/syncUtils.ts` to ensure all relevant data is synchronized.
*   **TODO: Replace with actual refreshing logic**
    *   **Plan:** Integrate the `forceSyncAll()` call within the `handleRefresh` function, ensuring `setRefreshing(false)` is called upon completion.

## 6. screens/tabs/log-dive/components/CreatureSelectionModal.tsx

*   **TODO: Implement proper creature selection logic**
    *   **Plan:** The current `handleCreatureImagePick` function is a placeholder. It needs to be updated to actually store the selected image URI against the `SelectedCreature` object. This will involve modifying the `selectedCreatures` state in the parent component (likely `log-dive/index.tsx`) to include the `imageUri`.

## 7. screens/tabs/log-dive/components/DiveSiteMap.tsx

*   **TODO: Implement proper dive site selection logic**
    *   **Plan:** The current `onDiveSiteSelect` in the cluster rendering logic is a placeholder. When a cluster is pressed and contains a few sites, instead of directly selecting the first one, a modal or action sheet should be presented to the user, allowing them to choose a specific dive site from the cluster. This will involve passing a more sophisticated `onDiveSiteSelect` handler from the parent component that can trigger such a UI.

## 8. screens/tabs/profile/index.tsx

*   **TODO: In a real implementation, we might want to force a sync**
    *   **Plan:** Replace the `setTimeout` in `handleRefresh` with a call to `forceSyncAll()` from `utils/syncUtils.ts` to ensure all relevant user data is synchronized.
*   **TODO: Replace with actual refreshing logic**
    *   **Plan:** Integrate the `forceSyncAll()` call within the `handleRefresh` function, ensuring `setRefreshing(false)` is called upon completion.

## 9. utils/device.ts

*   **TODO: Implement biometric support check**
    *   **Plan:** Use a library like `expo-local-authentication` to implement the `supportsBiometrics` function. This will involve checking `LocalAuthentication.hasHardwareAsync()` and `LocalAuthentication.isEnrolledAsync()` to determine if biometric authentication is available and configured on the device.

## 10. utils/syncUtils.ts

*   **TODO: The actual implementation would depend on how Legend State handles this**
    *   **Plan:** For `profile$.set({} as any);` in `clearUserSync`, investigate Legend State's documentation or examples for the recommended way to clear an observable that holds an object. It might involve setting it to `null` or a specific initial empty state that Legend State handles gracefully for user-specific data.
*   **TODO: This would need to be implemented based on Legend State's internal tracking**
    *   **Plan:** For `hasPendingSyncOperations`, consult Legend State's documentation for any built-in mechanisms or patterns to check for pending synchronization operations. If no direct API exists, it might involve tracking a custom flag or observing changes in the observable's internal state (if exposed) that indicates ongoing sync.
*   **TODO: Replace with actual implementation**
    *   **Plan:** This is a general placeholder. Once the Legend State specific tracking for pending operations is understood, replace this placeholder with the actual implementation.
