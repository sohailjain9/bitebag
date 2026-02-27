import { useState, useEffect } from "react";
import { Search, ChevronDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import RestaurantCard from "@/components/RestaurantCard";
import { restaurants } from "@/data/restaurants";

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("Detecting...");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocation("Bandra West, Mumbai"),
        () => setLocation("Mumbai, India")
      );
    } else {
      setLocation("Mumbai, India");
    }
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase())
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
          <span className="text-foreground text-xs font-bold ml-1">{location}</span>
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

        {/* Restaurant list */}
        <div className="flex flex-col gap-4 pb-4">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No restaurants found
            </p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Home;
