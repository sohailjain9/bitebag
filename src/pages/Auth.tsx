import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Step = "phone" | "otp" | "name" | "address";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const startCountdown = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("otp");
      startCountdown();
      toast({ title: "OTP sent!", description: `Code sent to +91 ${phone}` });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone, code },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      if (data?.isNewUser) {
        setStep("name");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleNameContinue = () => {
    if (!name.trim()) return;
    setStep("address");
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not available", variant: "destructive" });
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          setAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
        } catch {
          setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setDetectingLocation(false);
      },
      () => {
        toast({ title: "Location access denied", variant: "destructive" });
        setDetectingLocation(false);
      }
    );
  };

  const handleComplete = async (skipAddress = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          display_name: name.trim(),
          saved_address: skipAddress ? null : (address.trim() || null),
        } as any).eq("user_id", user.id);
      }
      navigate("/home");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "phone") navigate(-1);
    else if (step === "otp") setStep("phone");
    else if (step === "name") setStep("otp");
    else setStep("name");
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen px-6 pt-4 animate-slide-in">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary mb-6"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>

        {step === "phone" && (
          <div className="animate-fade-scale-in">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
              Enter your mobile number
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              We'll send you a one-time password via SMS
            </p>

            <div className="flex gap-3 mb-6">
              <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-3.5 text-sm font-medium text-foreground shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Phone number"
                className="flex-1 bg-secondary rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>

            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Send OTP
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="animate-fade-scale-in">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
              Verify OTP
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Enter the 6-digit code sent to +91 {phone}
            </p>

            <div className="flex gap-2 mb-6 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-secondary rounded-xl outline-none focus:ring-2 focus:ring-primary/30"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={otp.some((d) => d === "") || loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97] mb-4 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Verify
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                <button
                  onClick={() => { handleSendOtp(); }}
                  className="text-primary font-medium"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>
        )}

        {step === "name" && (
          <div className="animate-fade-scale-in">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
              Welcome to Swoop! 🎉
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              What should we call you?
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30 mb-6 placeholder:text-muted-foreground"
            />

            <button
              onClick={handleNameContinue}
              disabled={!name.trim()}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              Continue
            </button>
          </div>
        )}

        {step === "address" && (
          <div className="animate-fade-scale-in">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
              Where do you usually order to?
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              We'll use this for faster checkout
            </p>

            <button
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="w-full flex items-center justify-center gap-2 bg-secondary rounded-xl px-4 py-3.5 text-sm font-medium text-foreground mb-4 transition-all active:scale-[0.97]"
            >
              {detectingLocation ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <MapPin size={16} className="text-primary" />
              )}
              {detectingLocation ? "Detecting location..." : "Use my current location 📍"}
            </button>

            <div className="relative mb-6">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your home or work address"
                className="w-full bg-secondary rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>

            <button
              onClick={() => handleComplete(false)}
              disabled={!address.trim() || loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97] mb-4 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Continue
            </button>

            <button
              onClick={() => handleComplete(true)}
              disabled={loading}
              className="w-full text-center text-sm text-muted-foreground underline"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Auth;
