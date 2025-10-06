
# Direct Supabase Usage

Based on my analysis, the following files use Supabase queries directly without the `@legendapp/state` library:

*   **`app/_layout.tsx`**: Manages authentication state using `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
*   **`utils/supabaseUtils.ts`**: Makes a direct RPC call with `supabase.rpc('refresh_schema_cache')`.
*   **`screens/tabs/profile/index.tsx`**: Handles user profile actions with `supabase.auth.getUser()` and `supabase.auth.signOut()`.
*   **`screens/auth/reset-password/index.tsx`**: Manages password reset functionality with `supabase.auth.setSession()`, `supabase.auth.getSession()`, and `supabase.auth.updateUser()`.
*   **`screens/auth/login/index.tsx`**: Implements authentication with `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`.
*   **`screens/profile/edit/hooks/useProfile.ts`**: Manages user profile data and actions with `supabase.auth.getUser()`, `supabase.auth.signOut()`, `supabase.auth.admin.deleteUser()`, and a wrapped `supabase.storage` call.
*   **`screens/profile/change-password/hooks/useChangePassword.ts`**: Updates user information with `supabase.auth.updateUser()`.
*   **`screens/creatures/[id]/index.tsx`**: Fetches user data with `supabase.auth.getUser()`.
*   **`screens/modal/leaderboard/index.tsx`**: Queries the database directly with `supabase.from('profiles').select()` and `supabase.from('sightings').select()`.
*   **`hooks/useSyncedData.ts`**: Retrieves user data with `supabase.auth.getUser()`.
*   **`services/supabase.ts`**: Initializes the Supabase client and includes a wrapper function for `supabase.storage`.
