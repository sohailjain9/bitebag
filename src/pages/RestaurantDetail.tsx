import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ShoppingBag, Leaf } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { restaurants } from "@/data/restaurants";

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const savings = restaurant.originalValue - restaurant.bagPrice;
  const remainingPercent = (restaurant.bagsAvailable / restaurant.bagsTotal) * 100;

  return (
    <MobileLayout showNav={false} className="pb-0">
      <div className="animate-slide-in">
        {/* Hero */}
        <div className="relative h-[250px]">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Content card overlapping */}
        <div className="relative bg-background slide-up-overlap px-5 pt-6 min-h-[calc(100vh-226px)]">
          <h1 className="font-heading font-bold text-2xl text-foreground">{restaurant.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {restaurant.cuisine} · {restaurant.location}
          </p>

          <span className="inline-block bg-primary-light text-primary-light-foreground text-xs font-semibold px-3 py-1 rounded-full mt-3">
            Open for orders
          </span>

          <hr className="border-border my-5" />

          {/* Surprise bag section */}
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={18} className="text-primary" />
            <h2 className="font-heading font-bold text-base text-foreground">Tonight's Surprise Bag</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            A delightful mix of {restaurant.name}'s items — freshly prepared today, rescued from waste
          </p>

          {/* Pricing info box */}
          <div className="bg-secondary rounded-xl p-4 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original value</span>
              <span className="text-foreground font-medium">₹{restaurant.originalValue}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">You pay</span>
              <span className="text-primary font-bold">₹{restaurant.bagPrice}</span>
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
                {restaurant.bagsAvailable} of {restaurant.bagsTotal}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>

          {/* Collection window */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Clock size={16} className="text-primary" />
            <span>
              {restaurant.windowType}: {restaurant.window}
            </span>
          </div>

          <hr className="border-border mb-5" />

          {/* What could be in your bag */}
          <h3 className="font-heading font-bold text-base text-foreground mb-3">
            What could be in your bag?
          </h3>
          <ul className="space-y-2 mb-28">
            {restaurant.possibleItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Leaf size={14} className="text-primary mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border px-5 py-4 z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {restaurant.bagsAvailable} bags left
            </span>
            <button
              onClick={() =>
                navigate("/checkout", { state: { restaurant } })
              }
              className="bg-primary text-primary-foreground font-semibold px-6 py-3.5 rounded-2xl text-sm transition-transform active:scale-[0.97]"
            >
              Reserve My Bag — ₹{restaurant.bagPrice}
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default RestaurantDetail;
