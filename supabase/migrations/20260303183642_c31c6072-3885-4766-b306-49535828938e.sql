
-- Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text,
  address text,
  area text,
  city text DEFAULT 'Mumbai',
  latitude float,
  longitude float,
  photo_url text,
  total_bags integer,
  bags_remaining integer,
  bag_price integer,
  original_value integer,
  bag_contents text,
  pickup_start text,
  pickup_end text,
  delivery_available boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants are publicly readable"
ON public.restaurants FOR SELECT
USING (true);

-- Add missing columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;

-- Enable realtime for restaurants
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;
