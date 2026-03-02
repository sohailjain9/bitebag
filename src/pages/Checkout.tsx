import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import MobileLayout from "@/components/MobileLayout";
import { Restaurant } from "@/data/restaurants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const stripePromise = loadStripe("pk_test_51T5thVHcVIHeSK4lvTnxhAZpfbDouY9gZ5CInN6sxK0VylZputzvP68lJrYJxJyPMqsu0nKKOJIgjBe6btpLlQ4G00FLNiP3Sr");

const CheckoutForm = ({ restaurant, total, deliveryType, platformFee, deliveryFee }: {
  restaurant: Restaurant;
  total: number;
  deliveryType: "Pickup" | "Delivery";
  platformFee: number;
  deliveryFee: number;
}) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);

    try {
      // Create payment intent via edge function
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          amount: total,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          deliveryType,
          platformFee,
          deliveryFee,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message || "Payment failed");

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        toast.error(stripeError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        navigate("/confirmation", {
          state: {
            restaurant: { name: restaurant.name, window: restaurant.window, location: restaurant.location },
            total,
            deliveryType,
            orderNumber: data.orderNumber,
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={processing || !stripe}
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
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { restaurant: Restaurant } | null };
  const restaurant = state?.restaurant;

  const [deliveryType, setDeliveryType] = useState<"Pickup" | "Delivery">(
    restaurant?.windowType || "Delivery"
  );

  if (!restaurant) {
    navigate("/home");
    return null;
  }

  const platformFee = 10;
  const deliveryFee = deliveryType === "Delivery" ? 30 : 0;
  const total = restaurant.bagPrice + platformFee + deliveryFee;

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        fontFamily: "'Inter', sans-serif",
        "::placeholder": { color: "#9ca3af" },
      },
      invalid: { color: "#ef4444" },
    },
  };

  return (
    <MobileLayout showNav={false}>
      <Elements stripe={stripePromise}>
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

          {/* Card payment */}
          <div className="mb-28">
            <h3 className="font-heading font-bold text-sm mb-3">Pay with card</h3>
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-primary" />
                <span className="text-sm font-medium">Credit / Debit Card</span>
              </div>
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Sticky pay button */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border px-5 py-4 z-50">
            <CheckoutForm
              restaurant={restaurant}
              total={total}
              deliveryType={deliveryType}
              platformFee={platformFee}
              deliveryFee={deliveryFee}
            />
          </div>
        </div>
      </Elements>
    </MobileLayout>
  );
};

export default Checkout;
