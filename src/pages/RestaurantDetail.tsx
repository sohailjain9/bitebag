import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ShoppingBag, Leaf, Loader2, Truck } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { useRestaurants } from "@/hooks/useRestaurants";
import { formatPickupWindow } from "@/lib/formatTime";
import { useState } from "react";

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();
  const [imgError, setImgError] = useState(false);

  if (loading) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={28} className="text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const restaurant = restaurants.find((r) => r.id === id);

  if (!restaurant) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Restaurant not found</p>
        </div>
      </MobileLayout>
    );
  }

  const savings = (restaurant.original_value || 0) - (restaurant.bag_price || 0);
  const remainingPercent =
    restaurant.total_bags && restaurant.total_bags > 0
      ? ((restaurant.bags_remaining || 0) / restaurant.total_bags) * 100
      : 0;
  const soldOut = (restaurant.bags_remaining ?? 0) <= 0;
  const pickupWindow = formatPickupWindow(restaurant.pickup_start, restaurant.pickup_end);

  const initials = restaurant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <MobileLayout showNav={false} className="pb-0">
      <div className="animate-slide-in">
        {/* Hero */}
        <div className="relative h-[250px]">
          {!imgError && restaurant.photo_url ? (
            <img
              src={restaurant.photo_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-4xl font-bold">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="relative bg-background slide-up-overlap px-5 pt-6 min-h-[calc(100vh-226px)]">
          <h1 className="font-heading font-bold text-2xl text-foreground">{restaurant.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {restaurant.cuisine} · {restaurant.address}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="inline-block bg-primary-light text-primary-light-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {soldOut ? "Sold Out" : "Open for orders"}
            </span>
            {restaurant.delivery_available && (
              <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
                <Truck size={12} /> Delivery available
              </span>
            )}
          </div>

          <hr className="border-border my-5" />

          {/* Surprise bag section */}
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={18} className="text-primary" />
            <h2 className="font-heading font-bold text-base text-foreground">Tonight's Surprise Bag</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {restaurant.bag_contents || `A delightful mix of ${restaurant.name}'s items — freshly prepared today, rescued from waste`}
          </p>

          {/* Pricing */}
          <div className="bg-secondary rounded-xl p-4 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original value</span>
              <span className="text-foreground font-medium">₹{restaurant.original_value}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">You pay</span>
              <span className="text-primary font-bold">₹{restaurant.bag_price}</span>
            </div>
            <hr className="border-border my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You save</span>
              <span className="text-primary font-bold">₹{savings}</span>
            </div>
          </div>

          {/* Bags remaining */}
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Bags remaining</span>
              <span className="text-foreground font-medium">
                {restaurant.bags_remaining} of {restaurant.total_bags}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>

          {/* Pickup window */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Clock size={16} className="text-primary" />
            <span>Pickup: {pickupWindow}</span>
          </div>

          <hr className="border-border mb-5" />

          <h3 className="font-heading font-bold text-base text-foreground mb-3">
            What could be in your bag?
          </h3>
          <ul className="space-y-2 mb-28">
            {(restaurant.bag_contents || "").split(",").map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Leaf size={14} className="text-primary mt-0.5 shrink-0" />
                {item.trim()}
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border px-5 py-4 z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {soldOut ? "Sold out" : `${restaurant.bags_remaining} bags left`}
            </span>
            <button
              disabled={soldOut}
              onClick={() => navigate("/checkout", { state: { restaurant } })}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-2xl text-sm transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {soldOut ? "Sold Out" : `Reserve My Bag — ₹${restaurant.bag_price}`}
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default RestaurantDetail;
