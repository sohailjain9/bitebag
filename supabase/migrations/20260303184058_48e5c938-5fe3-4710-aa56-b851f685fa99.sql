
-- Create a function to atomically decrement bags
CREATE OR REPLACE FUNCTION public.decrement_bags(restaurant_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer;
BEGIN
  UPDATE public.restaurants
  SET bags_remaining = bags_remaining - 1
  WHERE id = restaurant_uuid AND bags_remaining > 0
  RETURNING bags_remaining INTO remaining;
  
  RETURN COALESCE(remaining, -1);
END;
$$;
