import { useEffect, useState } from "react";
import { User, MapPin, Bell, HelpCircle, LogOut, ChevronRight, Loader2 } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: MapPin, label: "Saved Addresses", path: "/profile/addresses" },
  { icon: Bell, label: "Notifications", path: "/profile/notifications" },
  { icon: HelpCircle, label: "Help & Support", path: "/profile/help" },
];

const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, created_at")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || "Swoop User");
        setPhone(data.phone || "");
        const d = new Date(data.created_at);
        const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        setMemberSince(`Member since ${months[d.getMonth()]} ${d.getFullYear()}`);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex justify-center pt-20">
          <Loader2 size={28} className="text-primary animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-6 animate-fade-scale-in">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">{displayName}</h1>
            <p className="text-muted-foreground text-sm">+91 {phone}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs mb-8 ml-20">{memberSince}</p>

        {/* Menu */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 py-3.5 px-1 text-left border-b border-border"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 py-3.5 px-1 text-left text-destructive"
          >
            {loggingOut ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="font-heading font-bold text-primary text-lg">Swoop</p>
          <p className="text-muted-foreground text-xs mt-1">v1.0.0 · Made with 💚 in India</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;
