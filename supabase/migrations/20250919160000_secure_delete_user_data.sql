/*
  # Secure delete user data function

  1. Enhanced Security
    - Function can only be called by authenticated users
    - Users can only delete their own data
    - Additional validation to prevent accidental data loss
*/

-- Drop existing function
DROP FUNCTION IF EXISTS delete_user_data(uuid);

-- Create new secure function
CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate input
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Access denied: User must be authenticated';
  END IF;

  -- Only allow users to delete their own data
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied: You can only delete your own data';
  END IF;

  -- Additional check to ensure user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete user achievements (will cascade)
  DELETE FROM user_achievements WHERE user_achievements.user_id = delete_user_data.user_id;
  
  -- Delete wishlists (will cascade)
  DELETE FROM wishlists WHERE wishlists.user_id = delete_user_data.user_id;
  
  -- Delete sightings (will cascade)
  DELETE FROM sightings WHERE sightings.user_id = delete_user_data.user_id;
  
  -- Delete profile (will cascade)
  DELETE FROM profiles WHERE profiles.id = delete_user_data.user_id;
  
  -- Note: The auth.users record will be deleted by Supabase auth.admin.deleteUser()
  -- or by the on_auth_user_deleted trigger
END;
$$;

-- Grant execute permission only to authenticated users
REVOKE ALL ON FUNCTION delete_user_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_data(uuid) TO authenticated;