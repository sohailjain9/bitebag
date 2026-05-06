import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";


const Splash = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout showNav={false}>
      <div className="flex flex-col items-center justify-center min-h-screen px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-3 animate-fade-scale-in">
          <h1 className="font-heading font-extrabold text-4xl text-primary tracking-tight">
            Swoop
          </h1>
        </div>
        <p className="text-muted-foreground text-base text-center mb-12">
          Great food, greater prices, zero waste.
        </p>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-base transition-transform active:scale-[0.97]"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/auth?mode=login")}
            className="w-full bg-background text-primary font-semibold py-4 rounded-2xl text-base border-2 border-primary transition-transform active:scale-[0.97]"
          >
            I already have an account — Log In
          </button>
        </div>

        <p className="text-muted-foreground text-[11px] text-center mt-8 px-4">
          By continuing you agree to our Terms and Privacy Policy
        </p>
      </div>
    </MobileLayout>
  );
};

export default Splash;
