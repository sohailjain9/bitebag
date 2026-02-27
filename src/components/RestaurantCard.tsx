import { Clock, ShoppingBag, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Restaurant } from "@/data/restaurants";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      className="w-full bg-background rounded-2xl card-shadow overflow-hidden text-left transition-transform active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative h-[180px] overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
          {restaurant.bagsAvailable} bags left
        </span>
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
          <span>{restaurant.windowType} {restaurant.window}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground line-through text-sm">₹{restaurant.originalValue}</span>
            <span className="text-primary font-bold text-lg">₹{restaurant.bagPrice}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <Plus size={18} className="text-primary-foreground" />
          </div>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;
