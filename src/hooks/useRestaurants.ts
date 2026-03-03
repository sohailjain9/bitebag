import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DbRestaurant } from "@/types/restaurant";

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<DbRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("restaurants")
      .select("*")
      .eq("active", true)
      .order("name");
    if (err) {
      setError(err.message);
    } else {
      setRestaurants((data as unknown as DbRestaurant[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetch, 60000);

    // Realtime subscription for bags_remaining updates
    const channel = supabase
      .channel("restaurants-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "restaurants" }, (payload) => {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } as DbRestaurant : r))
        );
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  return { restaurants, loading, error, refetch: fetch };
}
