-- Create leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  creatures_discovered BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT s.creature_id) as creatures_discovered,
    COALESCE(SUM(c.points), 0) as total_points
  FROM public.profiles p
  LEFT JOIN public.sightings s ON p.id = s.user_id
  LEFT JOIN public.creatures c ON s.creature_id = c.id
  WHERE p.full_name IS NOT NULL 
    AND p.full_name != ''
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY total_points DESC, creatures_discovered DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;