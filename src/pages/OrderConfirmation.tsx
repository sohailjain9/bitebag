import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { formatOrderDate, formatPickupWindow } from "@/lib/formatTime";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: {
      restaurant: { name: string; address: string | null; pickup_start: string | null; pickup_end: string | null };
      total: number;
      deliveryType: string;
      deliveryAddress?: string;
      orderNumber: string;
      createdAt: string;
    } | null;
  };

  if (!state) {
    navigate("/home");
    return null;
  }

  const pickupWindow = formatPickupWindow(state.restaurant.pickup_start, state.restaurant.pickup_end);
  const orderTime = formatOrderDate(state.createdAt);

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
              <span className="text-muted-foreground">Order number</span>
              <span className="font-medium">{state.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restaurant</span>
              <span className="font-medium">{state.restaurant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-bold text-primary">₹{state.total}</span>
            </div>
            {state.deliveryType === "Pickup" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup at</span>
                  <span className="font-medium text-right max-w-[60%]">{state.restaurant.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup window</span>
                  <span className="font-medium">{pickupWindow}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivering to</span>
                  <span className="font-medium text-right max-w-[60%]">{state.deliveryAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated delivery</span>
                  <span className="font-medium">30-45 minutes</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order placed</span>
              <span className="font-medium text-right max-w-[60%]">{orderTime}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base transition-transform active:scale-[0.97]"
          >
            View My Orders
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
