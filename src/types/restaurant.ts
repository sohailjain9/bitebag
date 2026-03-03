export interface DbRestaurant {
  id: string;
  name: string;
  cuisine: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  total_bags: number | null;
  bags_remaining: number | null;
  bag_price: number | null;
  original_value: number | null;
  bag_contents: string | null;
  pickup_start: string | null;
  pickup_end: string | null;
  delivery_available: boolean | null;
  active: boolean | null;
  created_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_address: string | null;
  amount: number;
  platform_fee: number;
  delivery_fee: number;
  total: number;
  delivery_type: string;
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  stripe_payment_intent_id: string | null;
  status: string;
  created_at: string;
}
