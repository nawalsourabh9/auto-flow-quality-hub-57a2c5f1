
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, TestTube } from "lucide-react";

const TaskRecurringDebugPanel = () => {
  const [taskId, setTaskId] = useState("");
  const [isTestingRecurring, setIsTestingRecurring] = useState(false);

  const testRecurringGeneration = async () => {
    if (!taskId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task ID to test",
        variant: "destructive"
      });
      return;
    }

    setIsTestingRecurring(true);
    try {
      console.log("Testing recurring generation for task:", taskId);

      // Call the generate_next_recurring_task function directly
      const { data: newTaskId, error } = await supabase
        .rpc('generate_next_recurring_task', { completed_task_id: taskId });

      if (error) {
        console.error("Recurring generation error:", error);
        toast({
          title: "Generation Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else if (newTaskId) {
        console.log("Generated new recurring task:", newTaskId);
        toast({
          title: "Success",
          description: `Generated new recurring task with ID: ${newTaskId}`,
        });
      } else {
        console.log("No new task generated - conditions not met");
        toast({
          title: "No Task Generated",
          description: "Conditions for generating recurring task were not met (time constraints, duplicates, etc.)",
        });
      }
    } catch (error: any) {
      console.error("Test recurring generation failed:", error);
      toast({
        title: "Test Failed",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsTestingRecurring(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Recurring Task Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="taskId">Task ID to Test Recurring Generation</Label>
          <Input
            id="taskId"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Enter task UUID"
            className="font-mono text-sm"
          />
        </div>
        
        <Button
          onClick={testRecurringGeneration}
          disabled={isTestingRecurring || !taskId.trim()}
          className="flex items-center gap-2"
        >
          {isTestingRecurring ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isTestingRecurring ? "Testing..." : "Test Recurring Generation"}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>How to test:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a recurring task with daily/weekly frequency</li>
            <li>Mark it as completed (or use an existing completed recurring task)</li>
            <li>Copy the task ID and paste it above</li>
            <li>Click "Test Recurring Generation" to manually trigger the function</li>
          </ol>
          <p><strong>Note:</strong> The function checks time constraints, so a daily task completed today won't generate a new instance until tomorrow.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskRecurringDebugPanel;
