import { User, MapPin, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";

const menuItems = [
  { icon: MapPin, label: "Saved Addresses" },
  { icon: Bell, label: "Notifications" },
  { icon: HelpCircle, label: "Help & Support" },
];

const Profile = () => {
  return (
    <MobileLayout>
      <div className="px-5 pt-6 animate-fade-scale-in">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">BiteBag User</h1>
            <p className="text-muted-foreground text-sm">+91 98765 43210</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 py-3.5 px-1 text-left border-b border-border"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
          <button className="w-full flex items-center gap-3 py-3.5 px-1 text-left text-destructive">
            <LogOut size={20} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="font-heading font-bold text-primary text-lg">BiteBag</p>
          <p className="text-muted-foreground text-xs mt-1">v1.0.0 · Made with 💚 in India</p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;
