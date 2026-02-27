import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: {
      restaurant: { name: string; window: string; location: string };
      total: number;
      deliveryType: string;
      orderNumber: string;
    } | null;
  };

  if (!state) {
    navigate("/home");
    return null;
  }

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-scale-in">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 animate-pulse-check">
          <Check size={36} className="text-primary-foreground" strokeWidth={3} />
        </div>

        <h1 className="font-heading font-bold text-[28px] text-foreground text-center mb-2">
          Order Confirmed! 🎉
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Get ready for your BiteBag
        </p>

        {/* Order details card */}
        <div className="w-full bg-secondary rounded-2xl p-5 mb-8">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restaurant</span>
              <span className="font-medium">{state.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order number</span>
              <span className="font-medium">{state.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{state.deliveryType} window</span>
              <span className="font-medium">{state.restaurant.window}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {state.deliveryType === "Pickup" ? "Pickup at" : "Status"}
              </span>
              <span className="font-medium text-right">
                {state.deliveryType === "Pickup"
                  ? state.restaurant.location
                  : "Driver will be assigned shortly"}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base transition-transform active:scale-[0.97]"
          >
            Track My Order
          </button>
          <button
            onClick={() => navigate("/home")}
            className="w-full bg-background text-primary font-semibold py-4 rounded-2xl text-base border-2 border-primary transition-transform active:scale-[0.97]"
          >
            Back to Home
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default OrderConfirmation;
