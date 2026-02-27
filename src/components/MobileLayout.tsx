import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

const MobileLayout = ({ children, showNav = true, className = "" }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted">
      <div className={`mobile-container bg-background ${className}`}>
        <div className={showNav ? "pb-20" : ""}>{children}</div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default MobileLayout;
