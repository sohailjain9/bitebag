import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Loader2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SavedAddresses = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchAddresses = async () => {
      const all: string[] = [];

      // Saved address from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("saved_address")
        .eq("user_id", user.id)
        .single();
      if ((profile as any)?.saved_address) {
        all.push((profile as any).saved_address);
      }

      // Delivery addresses from orders
      const { data: orders } = await supabase
        .from("orders")
        .select("delivery_address")
        .eq("user_id", user.id)
        .not("delivery_address", "is", null);
      if (orders) {
        orders.forEach((o: any) => {
          if (o.delivery_address && !all.includes(o.delivery_address)) {
            all.push(o.delivery_address);
          }
        });
      }

      setAddresses(all);
      setLoading(false);
    };
    fetchAddresses();
  }, [user, authLoading]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Copied!");
  };

  return (
    <MobileLayout showNav={false}>
      <div className="px-5 pt-4 animate-slide-in">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-xl text-foreground">Saved Addresses</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-primary animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No saved addresses yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr, i) => (
              <button
                key={i}
                onClick={() => copyAddress(addr)}
                className="w-full flex items-start gap-3 bg-secondary rounded-xl p-4 text-left"
              >
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground flex-1">{addr}</p>
                <Copy size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SavedAddresses;
