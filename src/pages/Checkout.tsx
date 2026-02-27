import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, CreditCard } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { Restaurant } from "@/data/restaurants";

const Checkout = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { restaurant: Restaurant } | null };
  const restaurant = state?.restaurant;

  const [deliveryType, setDeliveryType] = useState<"Pickup" | "Delivery">(
    restaurant?.windowType || "Delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);

  if (!restaurant) {
    navigate("/home");
    return null;
  }

  const platformFee = 10;
  const deliveryFee = deliveryType === "Delivery" ? 30 : 0;
  const total = restaurant.bagPrice + platformFee + deliveryFee;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      navigate("/confirmation", {
        state: { restaurant, total, deliveryType, orderNumber: "#BB" + String(Math.floor(Math.random() * 900) + 100) },
      });
    }, 2000);
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen px-5 pt-4 animate-slide-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-xl text-foreground">Complete your order</h1>
        </div>

        {/* Order summary */}
        <div className="bg-secondary rounded-2xl p-4 mb-5">
          <h2 className="font-heading font-bold text-base mb-3">{restaurant.name}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surprise Bag</span>
              <span>₹{restaurant.bagPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span>₹{platformFee}</span>
            </div>
            {deliveryType === "Delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span>₹{deliveryFee}</span>
              </div>
            )}
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-primary">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        {/* Delivery toggle */}
        <div className="flex bg-secondary rounded-xl p-1 mb-5">
          {(["Pickup", "Delivery"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setDeliveryType(type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                deliveryType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Delivery address */}
        {deliveryType === "Delivery" && (
          <div className="mb-5">
            <h3 className="font-heading font-bold text-sm mb-3">Deliver to</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 bg-secondary rounded-xl p-3.5 text-left border-2 border-primary">
                <MapPin size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Use my current location</p>
                  <p className="text-xs text-muted-foreground">Bandra West, Mumbai</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 bg-secondary rounded-xl p-3.5 text-left border border-border">
                <MapPin size={18} className="text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">Enter address manually</p>
              </button>
            </div>
          </div>
        )}

        {/* Payment methods */}
        <div className="mb-28">
          <h3 className="font-heading font-bold text-sm mb-3">Pay with</h3>
          <div className="space-y-2">
            {[
              { id: "upi", label: "UPI", sub: "Pay via any UPI app" },
              { id: "gpay", label: "Google Pay", sub: "Quick payment" },
              { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard" },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-colors ${
                  paymentMethod === method.id
                    ? "bg-primary-light border-2 border-primary"
                    : "bg-secondary border border-border"
                }`}
              >
                <CreditCard size={18} className={paymentMethod === method.id ? "text-primary" : "text-muted-foreground"} />
                <div>
                  <p className="text-sm font-medium">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.sub}</p>
                </div>
                <div
                  className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.id ? "border-primary" : "border-border"
                  }`}
                >
                  {paymentMethod === method.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sticky pay button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border px-5 py-4 z-50">
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.97]"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                Pay ₹{total} securely
              </>
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Checkout;
