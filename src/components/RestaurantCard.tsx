import { Clock, ShoppingBag, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DbRestaurant } from "@/types/restaurant";
import { formatTimeSlot } from "@/lib/formatTime";
import { haversineKm } from "@/lib/distance";
import { useState } from "react";

interface RestaurantCardProps {
  restaurant: DbRestaurant;
  userLat?: number | null;
  userLon?: number | null;
}

const RestaurantCard = ({ restaurant, userLat, userLon }: RestaurantCardProps) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const soldOut = (restaurant.bags_remaining ?? 0) <= 0;

  const distanceText =
    userLat != null && userLon != null && restaurant.latitude != null && restaurant.longitude != null
      ? `${haversineKm(userLat, userLon, restaurant.latitude, restaurant.longitude).toFixed(1)} km away`
      : restaurant.area || "Mumbai";

  const initials = restaurant.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={() => !soldOut && navigate(`/restaurant/${restaurant.id}`)}
      disabled={soldOut}
      className={`w-full bg-background rounded-2xl card-shadow overflow-hidden text-left transition-transform active:scale-[0.98] ${soldOut ? "opacity-50 pointer-events-auto" : ""}`}
    >
      {/* Image */}
      <div className="relative h-[180px] overflow-hidden rounded-t-2xl">
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
        {/* Bags left pill */}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
            soldOut
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {soldOut ? "Sold Out" : `${restaurant.bags_remaining} bags left`}
        </span>
        {/* Delivery pill */}
        {restaurant.delivery_available && (
          <span className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            🛵 Delivery
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-lg text-foreground">{restaurant.name}</h3>
        <p className="text-muted-foreground text-[13px] mt-0.5">{restaurant.cuisine}</p>

        <div className="flex items-center gap-2 mt-3 text-[13px] text-muted-foreground">
          <ShoppingBag size={14} className="text-primary" />
          <span>Surprise Bag</span>
          <span className="text-muted-foreground">·</span>
          <Clock size={14} />
          <span>
            {formatTimeSlot(restaurant.pickup_start || "20:00")} - {formatTimeSlot(restaurant.pickup_end || "22:00")}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground line-through text-sm">₹{restaurant.original_value}</span>
            <span className="text-primary font-bold text-lg">₹{restaurant.bag_price}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">{distanceText}</span>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <Plus size={18} className="text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;
