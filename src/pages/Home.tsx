import { useState } from "react";
import { Search, ChevronDown, User, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import RestaurantCard from "@/components/RestaurantCard";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useUserLocation } from "@/hooks/useUserLocation";

const Home = () => {
  const navigate = useNavigate();
  const { restaurants, loading, error, refetch } = useRestaurants();
  const { location: userLoc } = useUserLocation();
  const [search, setSearch] = useState("");

  const locationText = userLoc ? "Bandra West, Mumbai" : "Mumbai, India";

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.cuisine || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileLayout>
      <div className="px-4 pt-4 animate-fade-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-heading font-extrabold text-xl text-primary">BiteBag</h1>
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <User size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Location */}
        <button className="flex items-center gap-1 mb-4 group">
          <span className="text-muted-foreground text-xs">Delivering to</span>
          <span className="text-foreground text-xs font-bold ml-1">{locationText}</span>
          <ChevronDown size={14} className="text-primary" />
        </button>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines"
            className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">
            Available Tonight 🌙
          </h2>
          <span className="bg-primary-light text-primary-light-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Updated live
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-destructive text-sm mb-3">Unable to load restaurants. Tap to retry.</p>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Restaurant list */}
        {!loading && !error && (
          <div className="flex flex-col gap-4 pb-4">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                userLat={userLoc?.latitude}
                userLon={userLoc?.longitude}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">
                No restaurants found
              </p>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Home;
