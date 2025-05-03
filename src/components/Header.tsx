import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Map, Truck, Menu, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  
  // Check if the current path is the user dashboard
  const isUserDashboard = location.pathname.includes('/user-dashboard');
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Auth state change in AuthProvider will handle the redirect
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-cyber-dark/70 backdrop-blur-lg border-b border-cyber-neon/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-cyber-neon" />
          <h1 className="text-xl font-bold cyber-text-glow tracking-wider">CYBER<span className="text-cyber-neon">ROUTE</span></h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {!isUserDashboard && (
            <>
              <NavLink to="/" icon={<Map size={16} />} label="Map" />
              <NavLink to="/shipments" icon={<Package size={16} />} label="Shipments" />
              <NavLink to="/customers" icon={<Users size={16} />} label="Customers" />
            </>
          )}

          <Button 
            onClick={handleLogout}
            variant="ghost" 
            size="sm" 
            className="text-gray-300 hover:text-cyber-neon hover:bg-cyber-neon/10"
          >
            <LogOut size={16} className="mr-1.5" />
            Logout
          </Button>
        </nav>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-cyber-neon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-cyber-dark/95 border-cyber-neon/20">
              <div className="flex flex-col gap-6 pt-8">
                {!isUserDashboard && (
                  <>
                    <MobileNavLink to="/" icon={<Map size={20} />} label="Map" onClick={() => setOpen(false)} />
                    <MobileNavLink to="/shipments" icon={<Package size={20} />} label="Shipments" onClick={() => setOpen(false)} />
                    <MobileNavLink to="/customers" icon={<Users size={20} />} label="Customers" onClick={() => setOpen(false)} />
                  </>
                )}
                <div className={`${!isUserDashboard ? 'border-t border-cyber-neon/20 pt-4 mt-4' : ''}`}>
                  <Button 
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    variant="ghost" 
                    size="sm"
                    className="w-full flex items-center gap-2 justify-start text-gray-300 hover:text-cyber-neon hover:bg-cyber-neon/10"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  icon?: React.ReactNode;
  label: string;
}

function NavLink({ to, icon, label }: NavLinkProps) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-1.5 text-gray-300 hover:text-cyber-neon transition-colors"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick?: () => void;
}

function MobileNavLink({ to, icon, label, onClick }: MobileNavLinkProps) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-3 px-2 py-3 text-gray-300 hover:text-cyber-neon transition-colors"
    >
      {icon}
      <span className="text-lg">{label}</span>
    </Link>
  );
}
