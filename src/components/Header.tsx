
import { Link } from 'react-router-dom';
import { Package, Map, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-cyber-dark/70 backdrop-blur-lg border-b border-cyber-neon/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-cyber-neon" />
          <h1 className="text-xl font-bold cyber-text-glow tracking-wider">CYBER<span className="text-cyber-neon">ROUTE</span></h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" icon={<Map size={16} />} label="Map" />
          <NavLink to="/shipments" icon={<Package size={16} />} label="Shipments" />
          <NavLink to="/customers" icon={<Package size={16} />} label="Customers" />

            <Button 
            onClick={() => window.location.href = "/auth"} 
            variant="ghost" 
            size="sm" 
            className="text-gray-300 hover:text-cyber-neon hover:bg-cyber-neon/10"
            >
            Logout
            </Button>
        </nav>
        
        {/* <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:flex border-cyber-neon/30 text-cyber-neon hover:border-cyber-neon hover:bg-cyber-neon/10">
            Connect API
          </Button>
          <Button size="sm" className="bg-cyber-neon text-cyber-black hover:bg-cyber-neon/80">
            <Package size={16} className="mr-2" /> New Shipment
          </Button>
        </div> */}
        
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
