import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { sampleOrders, Order } from "@/data/restaurants";
import { ChevronDown, ChevronUp } from "lucide-react";

const statusColors: Record<Order["status"], string> = {
  Collected: "bg-primary-light text-primary-light-foreground",
  "On the way": "bg-amber-100 text-amber-700",
  Upcoming: "bg-secondary text-muted-foreground",
};

const Orders = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <MobileLayout>
      <div className="px-5 pt-5 animate-fade-scale-in">
        <h1 className="font-heading font-bold text-xl text-foreground mb-5">My Orders</h1>

        {sampleOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {sampleOrders.map((order) => {
              const expanded = expandedId === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full bg-secondary rounded-2xl p-4 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-base">
                        {order.restaurant.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm animate-fade-scale-in">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order number</span>
                        <span>{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount paid</span>
                        <span className="font-bold text-primary">₹{order.pricePaid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>{order.deliveryType}</span>
                      </div>
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
