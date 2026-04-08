import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Lock, Loader2, Check } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { DbRestaurant } from "@/types/restaurant";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatPickupWindow } from "@/lib/formatTime";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const [processing, setProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

  const handlePay = async () => {
    if (processing) return;

    // Check bags
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

      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
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

      if (!window.Razorpay) {
        throw new Error("Payment gateway is loading, please try again");
      }

      const options = {
        key: data.razorpayKeyId,
        amount: total * 100,
        currency: "INR",
        name: "BiteBag",
        description: "Surprise Bag Order",
        order_id: data.orderId,
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        theme: { color: "#2D6A4F" },
        handler: async (response: any) => {
          // Payment succeeded — verify and confirm
          try {
            const { error: confirmError } = await supabase.functions.invoke("confirm-razorpay-payment", {
              body: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                dbOrderId: data.dbOrderId,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                restaurantAddress: restaurant.address || "",
                customerName,
                customerPhone,
                deliveryType,
                deliveryAddress: deliveryType === "Delivery" ? deliveryAddress : "",
                bagPrice: restaurant.bag_price || 0,
                deliveryFee,
                totalAmount: total,
              },
            });

            if (confirmError) {
              console.error("Confirm error:", confirmError);
            }
          } catch (e) {
            console.error("Post-payment confirmation failed:", e);
          }

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
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp.error?.description || "Payment failed");
        setProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setProcessing(false);
    }
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

        {/* Payment info */}
        <div className="mb-28">
          <h3 className="font-heading font-bold text-sm mb-3">💳 Payment</h3>
          <div className="bg-secondary rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">
              Pay securely via Razorpay — UPI, cards, wallets, and net banking supported.
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            <Lock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Secured by Razorpay</span>
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
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Lock size={16} />
                🔒 Pay ₹{total} securely
              </>
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Checkout;
