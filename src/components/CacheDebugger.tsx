import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { clearBrowserCache, clearReactQueryCache, forceReload } from "@/utils/cacheManager";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CacheDebugger(): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      // Clear browser cache
      await clearBrowserCache();
      
      // Clear React Query cache
      clearReactQueryCache(queryClient);
      
      toast({
        title: "Cache Cleared",
        description: "All caches have been cleared successfully",
      });
      
      // Force reload after a short delay
      setTimeout(() => {
        forceReload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceReload = () => {
    forceReload();
  };

  // Show debug panel only in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
        >
          <AlertCircle size={16} className="mr-1" />
          Debug
        </Button>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-cyber-dark border-cyber-neon/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Cache Debug Panel
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={handleClearCache}
            disabled={isClearing}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isClearing ? (
              <RefreshCcw size={14} className="mr-2 animate-spin" />
            ) : (
              <Trash2 size={14} className="mr-2" />
            )}
            Clear All Cache
          </Button>
          
          <Button
            onClick={handleForceReload}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCcw size={14} className="mr-2" />
            Force Reload
          </Button>
          
          <div className="text-xs text-gray-400 mt-2">
            <p>• Clears browser & query cache</p>
            <p>• Forces page reload</p>
            <p>• Fixes loading issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
