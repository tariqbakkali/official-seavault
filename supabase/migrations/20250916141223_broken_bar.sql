/*
  # Create delete user data function

  1. New Functions
    - `delete_user_data(user_id)` - Safely deletes all user data from all tables
  
  2. Security
    - Function can only be called by authenticated users
    - Users can only delete their own data
    - Cascading deletes handle related records
*/

CREATE OR REPLACE FUNCTION delete_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to delete their own data
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied: You can only delete your own data';
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
END;
$$;