import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CongratulationsDashboardLayout from "@/components/layout/CongratulationsDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Trophy } from "lucide-react";

export default function CongratulationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Get parameters from URL if they exist
  const message = searchParams.get('message') || 'Account Made Successfully';
  const returnTo = searchParams.get('returnTo') || '/auth';
  const returnText = searchParams.get('returnText') || 'Return to Login Page';
  
  useEffect(() => {
    // Trigger the animation completion after a delay
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <CongratulationsDashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className={`transform transition-all duration-1000 ${animationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="relative mb-8">
            <div className="absolute -inset-1 rounded-full bg-cyber-neon/20 blur-xl animate-pulse-glow"></div>
            <div className="relative bg-cyber-dark rounded-full p-4 border border-cyber-neon/30 animate-float flex items-center space-x-3">
              <Trophy size={64} className="text-cyber-neon" />
              <span className="text-xl font-semibold text-cyber-neon cyber-text-glow">Account Verified</span>
            </div>
          </div>
          
          <Card className="w-full max-w-md mx-auto bg-cyber-card border-cyber-neon/20 shadow-lg overflow-hidden">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-cyber-neon cyber-text-glow" />
                
                <h1 className="text-3xl font-bold cyber-text-glow tracking-tight">
                  <span className="text-cyber-neon">Congratulations!</span>
                </h1>
                
                <p className="text-lg text-gray-300">{message}</p>
                
                <div className="h-px w-full bg-gradient-to-r from-cyber-neon/0 via-cyber-neon/20 to-cyber-neon/0 my-4"></div>
                
                <div className="pt-2">
                  <Button 
                    onClick={() => navigate(returnTo)}
                    className="bg-cyber-neon text-black hover:bg-cyber-neon/80 cyber-border-glow group"
                  >
                    {returnText}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Background grid effect */}
      <div className="fixed inset-0 -z-10 bg-cyber-grid bg-cyber-grid opacity-10 pointer-events-none"></div>
    </CongratulationsDashboardLayout>
  );
}
