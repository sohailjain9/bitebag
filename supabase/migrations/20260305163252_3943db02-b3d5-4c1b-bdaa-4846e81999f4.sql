
CREATE OR REPLACE FUNCTION public.reset_all_bags()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.restaurants
  SET bags_remaining = total_bags
  WHERE active = true;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
