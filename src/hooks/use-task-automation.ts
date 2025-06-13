
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTaskAutomation = () => {
  const [isRunning, setIsRunning] = useState(false);

  // Manual trigger (existing functionality)
  const triggerAutomation = async () => {
    try {
      setIsRunning(true);
      console.log("Triggering task automation...");

      // Call the Edge Function directly
      const { data, error } = await supabase.functions.invoke('task-automation', {
        body: { manual: true }
      });

      if (error) {
        console.error("Error triggering automation:", error);
        toast({
          title: "Error",
          description: "Failed to trigger task automation",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Automation result:", data);
      toast({
        title: "Success",
        description: "Task automation completed successfully"
      });

    } catch (error) {
      console.error("Error in triggerAutomation:", error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Automatic background automation (FREE tier solution)
  const runBackgroundAutomation = useCallback(async () => {
    try {
      console.log('Running background task automation...');
      
      // Call the Edge Function instead of RPC for consistency
      const { data, error } = await supabase.functions.invoke('task-automation', {
        body: { automated: true }
      });
      
      if (error) {
        console.error('Background automation error:', error);
        return;
      }
      
      console.log('Background automation result:', data);
      
    } catch (err) {
      console.error('Background automation exception:', err);
    }
  }, []);

  // Run automation on component mount (when app starts)
  useEffect(() => {
    runBackgroundAutomation();
  }, [runBackgroundAutomation]);

  // Run automation periodically (every 30 minutes when app is active)
  useEffect(() => {
    const interval = setInterval(runBackgroundAutomation, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [runBackgroundAutomation]);

  // Run automation when window gains focus (user returns to app)
  useEffect(() => {
    const handleFocus = () => {
      runBackgroundAutomation();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [runBackgroundAutomation]);

  return {
    triggerAutomation,
    isRunning,
    runBackgroundAutomation
  };
};
