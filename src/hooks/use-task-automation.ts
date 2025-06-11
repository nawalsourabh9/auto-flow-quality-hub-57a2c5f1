
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useTaskAutomation = () => {
  const [isRunning, setIsRunning] = useState(false);

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

  return {
    triggerAutomation,
    isRunning
  };
};
