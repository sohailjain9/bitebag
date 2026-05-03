import { useState, useEffect } from "react";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Loader2, ShoppingBag } from "lucide-react";
import { formatOrderDateShort } from "@/lib/formatTime";
import type { DbOrder } from "@/types/restaurant";

const statusColors: Record<string, string> = {
  confirmed: "bg-primary-light text-primary-light-foreground",
  "On the way": "bg-amber-100 text-amber-700",
  Completed: "bg-secondary text-muted-foreground",
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as unknown as DbOrder[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user, authLoading]);

  return (
    <MobileLayout>
      <div className="px-5 pt-5 animate-fade-scale-in">
        <h1 className="font-heading font-bold text-xl text-foreground mb-5">My Orders</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-heading font-bold text-lg text-foreground mb-1">No orders yet!</p>
            <p className="text-muted-foreground text-sm mb-6">Your Swoop orders will appear here</p>
            <button
              onClick={() => navigate("/home")}
              className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-2xl text-sm"
            >
              Explore Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const expanded = expandedId === order.id;
              const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);
              return (
                <button
                  key={order.id}
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full bg-secondary rounded-2xl p-4 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-base">
                        {order.restaurant_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatOrderDateShort(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] || "bg-secondary text-muted-foreground"}`}>
                        {statusLabel}
                      </span>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm animate-fade-scale-in">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order number</span>
                        <span>{order.order_number?.replace(/#BB/i, "#SW")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total paid</span>
                        <span className="font-bold text-primary">₹{order.total / 100}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="capitalize">{order.delivery_type}</span>
                      </div>
                      {order.delivery_type === "Delivery" && order.delivery_address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery to</span>
                          <span className="text-right max-w-[60%]">{order.delivery_address}</span>
                        </div>
                      )}
                      {order.delivery_type === "Pickup" && order.restaurant_address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pickup from</span>
                          <span className="text-right max-w-[60%]">{order.restaurant_address}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Orders;
