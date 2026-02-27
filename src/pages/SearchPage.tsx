import { useState } from "react";
import { Search } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import RestaurantCard from "@/components/RestaurantCard";
import { restaurants } from "@/data/restaurants";

const cuisineFilters = ["All", "Bakery", "Cafe", "Patisserie", "Indian"];

const SearchPage = () => {
  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");

  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    const matchesCuisine =
      activeCuisine === "All" || r.cuisine.toLowerCase().includes(activeCuisine.toLowerCase());
    return matchesSearch && matchesCuisine;
  });

  return (
    <MobileLayout>
      <div className="px-4 pt-5 animate-fade-scale-in">
        <h1 className="font-heading font-bold text-xl text-foreground mb-4">Search</h1>

        {/* Search input */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisines"
            className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        {/* Cuisine filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {cuisineFilters.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeCuisine === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No results</p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default SearchPage;
