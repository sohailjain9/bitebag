import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";

type Step = "phone" | "otp" | "name";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      setStep("otp");
      setCountdown(30);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.every((d) => d !== "")) {
      setStep("name");
    }
  };

  const handleComplete = () => {
    if (name.trim()) {
      navigate("/home");
    }
  };

  return (
    <MobileLayout showNav={false}>
      <div className="min-h-screen px-6 pt-4 animate-slide-in">
        {/* Back */}
        <button
          onClick={() => {
            if (step === "phone") navigate(-1);
            else if (step === "otp") setStep("phone");
            else setStep("otp");
          }}
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
              We'll send you a one-time password
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
              disabled={phone.length < 10}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97]"
            >
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
              disabled={otp.some((d) => d === "")}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97] mb-4"
            >
              Verify
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                <button
                  onClick={() => {
                    setCountdown(30);
                    const interval = setInterval(() => {
                      setCountdown((c) => {
                        if (c <= 1) { clearInterval(interval); return 0; }
                        return c - 1;
                      });
                    }, 1000);
                  }}
                  className="text-primary font-medium"
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
              What's your name?
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Let us know what to call you
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-secondary rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/30 mb-6 placeholder:text-muted-foreground"
            />

            <button
              onClick={handleComplete}
              disabled={!name.trim()}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base disabled:opacity-40 transition-all active:scale-[0.97]"
            >
              Let's Go 🎉
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Auth;
