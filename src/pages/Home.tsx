import { useState, useEffect } from "react";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import RestaurantCard from "@/components/RestaurantCard";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/lib/distance";

const categories = [
  { label: "All", filter: () => true },
  { label: "Nearby", filter: () => true, sort: true },
  { label: "Desserts", filter: (c: string) => /dessert|patisserie/i.test(c) },
  { label: "Cafes", filter: (c: string) => /cafe/i.test(c) },
  { label: "Bakeries", filter: (c: string) => /bakery|patisserie/i.test(c) },
  { label: "Indian Snacks", filter: (c: string) => /indian|snacks/i.test(c) },
];

function getGreeting(name: string): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return `Good morning, ${name}! ☀️`;
  if (h >= 12 && h < 17) return `Good afternoon, ${name}! 👋`;
  if (h >= 17 && h < 24) return `Good evening, ${name}! 🌙`;
  return `Up late, ${name}? 🌙`;
}

const Home = () => {
  const navigate = useNavigate();
  const { restaurants, loading, error, refetch } = useRestaurants();
  const { location: userLoc } = useUserLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const filtered = restaurants
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.cuisine || "").toLowerCase().includes(search.toLowerCase());
      const cat = categories.find((c) => c.label === activeCategory);
      const matchesCat = !cat || activeCategory === "All" || activeCategory === "Nearby"
        ? true
        : cat.filter(r.cuisine || "");
      return matchesSearch && matchesCat;
    })
    .sort((a, b) => {
      if (activeCategory === "Nearby" && userLoc && a.latitude && a.longitude && b.latitude && b.longitude) {
        const distA = haversineKm(userLoc.latitude, userLoc.longitude, a.latitude, a.longitude);
        const distB = haversineKm(userLoc.latitude, userLoc.longitude, b.latitude, b.longitude);
        return distA - distB;
      }
      return (b.bags_remaining || 0) - (a.bags_remaining || 0);
    });

  const firstName = displayName.split(" ")[0] || "there";

  return (
    <MobileLayout>
      <div className="px-4 pt-4 animate-fade-scale-in">
        {/* Greeting */}
        <h1 className="font-heading font-bold text-[22px] text-foreground mb-1">
          {getGreeting(firstName)}
        </h1>
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-primary">📍</span>
          <span className="text-foreground text-xs font-bold">Mumbai</span>
          <span className="text-muted-foreground text-xs ml-1">Surprise bags near you</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-primary border border-primary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">
            Available Tonight 🌙
          </h2>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
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
