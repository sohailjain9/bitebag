import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DbRestaurant } from "@/types/restaurant";
import { formatTimeSlot } from "@/lib/formatTime";
import { haversineKm } from "@/lib/distance";
import { useState } from "react";
import { toast } from "sonner";

interface RestaurantCardProps {
  restaurant: DbRestaurant;
  userLat?: number | null;
  userLon?: number | null;
}

const RestaurantCard = ({ restaurant, userLat, userLon }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const soldOut = (restaurant.bags_remaining ?? 0) <= 0;
  const almostGone = !soldOut && (restaurant.bags_remaining || 0) <= 2;
  const savings = (restaurant.original_value || 0) - (restaurant.bag_price || 0);

  const distanceText =
    userLat != null && userLon != null && restaurant.latitude != null && restaurant.longitude != null
      ? `📍 ${haversineKm(userLat, userLon, restaurant.latitude, restaurant.longitude).toFixed(1)} km away`
      : "📍 Mumbai";

  const initials = restaurant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleClick = () => {
    if (soldOut) {
      toast("Sold out — check back tomorrow!");
      return;
    }
    navigate(`/restaurant/${restaurant.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-background rounded-2xl card-shadow overflow-hidden text-left transition-transform active:scale-[0.98] ${
        soldOut ? "opacity-50" : ""
      } ${almostGone ? "border-l-4 border-destructive" : ""}`}
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
        {!imgError && restaurant.photo_url ? (
          <img
            src={restaurant.photo_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-3xl font-bold">{initials}</span>
          </div>
        )}
        {/* Savings badge bottom-left */}
        {savings > 0 && !soldOut && (
          <span className="absolute bottom-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
            Save ₹{savings}
          </span>
        )}
        {/* Bags left pill top-left */}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
            soldOut
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {soldOut ? "Sold Out" : `${restaurant.bags_remaining} bags left`}
        </span>
        {/* Delivery pill top-right */}
        {restaurant.delivery_available && (
          <span className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            🛵 Delivery
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">{restaurant.name}</h3>
            <p className="text-muted-foreground text-[13px] mt-0.5">{restaurant.cuisine}</p>
          </div>
          {almostGone && (
            <span className="text-destructive text-[11px] font-semibold mt-1">Almost gone!</span>
          )}
        </div>

        <p className="text-muted-foreground text-xs mt-2">{distanceText}</p>

        {/* Time row */}
        <div className="flex items-center gap-1.5 mt-3 text-[13px] text-primary font-medium">
          <Clock size={14} />
          <span>
            Collect {formatTimeSlot(restaurant.pickup_start || "20:00")} – {formatTimeSlot(restaurant.pickup_end || "22:00")}
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-muted-foreground line-through text-sm">₹{restaurant.original_value}</span>
          <span className="text-primary font-bold text-lg">₹{restaurant.bag_price}</span>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;
