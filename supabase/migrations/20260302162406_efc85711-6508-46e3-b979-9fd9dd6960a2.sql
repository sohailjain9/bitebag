
-- Create a sequence for order numbers
CREATE SEQUENCE public.order_number_seq START WITH 1;

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  amount INTEGER NOT NULL, -- in paisa (INR cents)
  platform_fee INTEGER NOT NULL DEFAULT 1000,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'Delivery',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own orders
CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to generate BB### order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.order_number := '#BB' || LPAD(nextval('public.order_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate order number
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();
