import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, CreditCard, Loader2, Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import MobileLayout from "@/components/MobileLayout";
import { DbRestaurant } from "@/types/restaurant";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatPickupWindow } from "@/lib/formatTime";

const stripePromise = loadStripe("pk_test_51T5thVHcVIHeSK4lvTnxhAZpfbDouY9gZ5CInN6sxK0VylZputzvP68lJrYJxJyPMqsu0nKKOJIgjBe6btpLlQ4G00FLNiP3Sr");

interface CheckoutFormProps {
  restaurant: DbRestaurant;
  total: number;
  deliveryType: "Pickup" | "Delivery";
  deliveryFee: number;
  deliveryAddress: string;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}

const CheckoutForm = ({ restaurant, total, deliveryType, deliveryFee, deliveryAddress, restaurantLat, restaurantLng, deliveryLat, deliveryLng }: CheckoutFormProps) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { data: freshRestaurant } = await supabase
      .from("restaurants")
      .select("bags_remaining")
      .eq("id", restaurant.id)
      .single();

    if (!freshRestaurant || (freshRestaurant as any).bags_remaining <= 0) {
      toast.error("Sorry, all bags have been claimed!");
      return;
    }

    setProcessing(true);

    try {
      let customerName = "";
      let customerPhone = "";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, phone")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          customerName = profile.display_name || "";
          customerPhone = profile.phone || "";
        }
      }

      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          amount: total,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address || "",
          deliveryType,
          deliveryFee,
          deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : "",
          customerName,
          customerPhone,
          bagPrice: restaurant.bag_price || 0,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message || "Payment failed");

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
            restaurant: {
              name: restaurant.name,
              address: restaurant.address,
              pickup_start: restaurant.pickup_start,
              pickup_end: restaurant.pickup_end,
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            },
            total,
            deliveryType,
            deliveryAddress,
            orderNumber: data.orderNumber,
            createdAt: new Date().toISOString(),
            deliveryLat,
            deliveryLng,
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
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <>
          <Lock size={16} />
          🔒 Pay ₹{total} securely
        </>
      )}
    </button>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { restaurant: DbRestaurant } | null };
  const { user } = useAuth();
  const restaurant = state?.restaurant;
  const [deliveryType, setDeliveryType] = useState<"Pickup" | "Delivery">(
    restaurant?.delivery_available ? "Delivery" : "Pickup"
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [addressSource, setAddressSource] = useState<"saved" | "current" | "manual" | null>(null);

  // Fetch saved address
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("saved_address")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if ((data as any)?.saved_address) {
          setSavedAddress((data as any).saved_address);
        }
      });
  }, [user]);

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          setDeliveryAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
        } catch {
          setDeliveryAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setAddressSource("current");
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      }
    );
  };

  if (!restaurant) {
    navigate("/home");
    return null;
  }

  const bagPrice = restaurant.bag_price || 0;
  const deliveryFee = deliveryType === "Delivery" ? 49 : 0;
  const total = bagPrice + deliveryFee;

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        fontFamily: "'DM Sans', sans-serif",
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
                <span>₹{bagPrice}</span>
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
            {(["Pickup", "Delivery"] as const).map((type) => {
              const disabled = type === "Delivery" && !restaurant.delivery_available;
              return (
                <button
                  key={type}
                  disabled={disabled}
                  onClick={() => setDeliveryType(type)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    deliveryType === type
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  } ${disabled ? "opacity-40" : ""}`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Delivery address options */}
          {deliveryType === "Delivery" && (
            <div className="mb-5 space-y-3">
              <h3 className="font-heading font-bold text-sm mb-1">Where should we deliver?</h3>

              {/* Saved address option */}
              {savedAddress && (
                <button
                  onClick={() => {
                    setDeliveryAddress(savedAddress);
                    setAddressSource("saved");
                  }}
                  className={`w-full flex items-start gap-3 rounded-xl p-3.5 text-left border-2 transition-colors ${
                    addressSource === "saved" ? "border-primary bg-primary/5" : "border-border bg-secondary"
                  }`}
                >
                  {addressSource === "saved" && <Check size={16} className="text-primary shrink-0 mt-0.5" />}
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Saved address</p>
                    <p className="text-xs text-muted-foreground truncate">{savedAddress}</p>
                  </div>
                </button>
              )}

              {/* Use current location */}
              <button
                onClick={detectLocation}
                disabled={detectingLocation}
                className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left border-2 transition-colors ${
                  addressSource === "current" ? "border-primary bg-primary/5" : "border-border bg-secondary"
                }`}
              >
                {detectingLocation ? (
                  <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                ) : (
                  <MapPin size={16} className="text-primary shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {detectingLocation ? "Detecting location..." : "Use current location 📍"}
                </span>
              </button>

              {/* Manual input */}
              <div className={`rounded-xl p-3.5 border-2 transition-colors ${
                addressSource === "manual" ? "border-primary bg-primary/5" : "border-border bg-secondary"
              }`}>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <input
                    type="text"
                    value={addressSource === "manual" ? deliveryAddress : ""}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setAddressSource("manual");
                    }}
                    onFocus={() => setAddressSource("manual")}
                    placeholder="Enter delivery address"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Selected address display */}
              {deliveryAddress && addressSource && (
                <div className="bg-primary/5 border-2 border-primary rounded-xl p-3 text-xs text-foreground">
                  📍 Delivering to: {deliveryAddress}
                </div>
              )}
            </div>
          )}

          {/* Pickup info */}
          {deliveryType === "Pickup" && (
            <div className="mb-5">
              <h3 className="font-heading font-bold text-sm mb-3">Confirm your pickup</h3>
              <div className="flex items-start gap-3 bg-secondary rounded-xl p-3.5 border border-border">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{restaurant.name}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                  <p className="text-xs text-primary mt-1">
                    {formatPickupWindow(restaurant.pickup_start, restaurant.pickup_end)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="mb-28">
            <h3 className="font-heading font-bold text-sm mb-3">💳 Payment</h3>
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-primary" />
                <span className="text-sm font-medium">Credit / Debit Card</span>
              </div>
              <CardElement options={cardElementOptions} />
              <p className="text-[11px] text-muted-foreground mt-3">
                Test card: 4242 4242 4242 4242 | Any future date | Any CVC
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 justify-center">
              <Lock size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Secured by Stripe</span>
            </div>
          </div>

          {/* Sticky pay button */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background border-t border-border px-5 py-4 z-50">
            <CheckoutForm
              restaurant={restaurant}
              total={total}
              deliveryType={deliveryType}
              deliveryFee={deliveryFee}
              deliveryAddress={deliveryAddress}
              restaurantLat={restaurant.latitude}
              restaurantLng={restaurant.longitude}
              deliveryLat={deliveryLat}
              deliveryLng={deliveryLng}
            />
          </div>
        </div>
      </Elements>
    </MobileLayout>
  );
};

export default Checkout;
