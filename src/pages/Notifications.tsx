import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";

const Notifications = () => {
  const navigate = useNavigate();
  const [orderNotifs, setOrderNotifs] = useState(() => {
    const v = localStorage.getItem("notif_orders");
    return v === null ? true : v === "true";
  });
  const [dealNotifs, setDealNotifs] = useState(() => {
    const v = localStorage.getItem("notif_deals");
    return v === null ? true : v === "true";
  });

  useEffect(() => {
    localStorage.setItem("notif_orders", String(orderNotifs));
  }, [orderNotifs]);

  useEffect(() => {
    localStorage.setItem("notif_deals", String(dealNotifs));
  }, [dealNotifs]);

  return (
    <MobileLayout showNav={false}>
      <div className="px-5 pt-4 animate-slide-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-xl text-foreground">Notifications</h1>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between py-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Order confirmations</span>
            <button
              onClick={() => setOrderNotifs(!orderNotifs)}
              className={`w-12 h-7 rounded-full transition-colors relative ${orderNotifs ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${orderNotifs ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Deals and offers</span>
            <button
              onClick={() => setDealNotifs(!dealNotifs)}
              className={`w-12 h-7 rounded-full transition-colors relative ${dealNotifs ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${dealNotifs ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Notifications;
