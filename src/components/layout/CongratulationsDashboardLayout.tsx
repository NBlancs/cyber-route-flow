
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function CongratulationsDashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark">
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-cyber-neon/10 py-4 text-center text-xs text-gray-500">
        <div className="container mx-auto">
          <p>CYBER<span className="text-cyber-neon">ROUTE</span> © {new Date().getFullYear()} | Logistics Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
