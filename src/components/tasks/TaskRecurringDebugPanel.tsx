import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2, RefreshCw, Database } from "lucide-react";

const TaskRecurringDebugPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const cleanupDuplicateTasks = async () => {
    try {
      setIsLoading(true);
      console.log("Starting cleanup of duplicate recurring tasks...");

      // Find potential duplicate tasks (tasks with same parent_task_id and recurrence_count_in_period)
      const { data: duplicates, error: findError } = await supabase
        .from('tasks')
        .select('id, title, parent_task_id, recurrence_count_in_period, created_at')
        .not('parent_task_id', 'is', null)
        .order('created_at', { ascending: false });

      if (findError) {
        throw findError;
      }

      if (!duplicates || duplicates.length === 0) {
        toast({
          title: "No duplicates found",
          description: "No duplicate recurring tasks to clean up."
        });
        return;
      }

      // Group by parent_task_id and recurrence_count_in_period
      const grouped = duplicates.reduce((acc, task) => {
        const key = `${task.parent_task_id}-${task.recurrence_count_in_period}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(task);
        return acc;
      }, {} as Record<string, typeof duplicates>);

      // Find actual duplicates (groups with more than 1 task)
      const duplicateGroups = Object.values(grouped).filter(group => group.length > 1);
      
      if (duplicateGroups.length === 0) {
        toast({
          title: "No duplicates found",
          description: "No duplicate recurring tasks to clean up."
        });
        setIsLoading(false);
        return;
      }

      let deletedCount = 0;
      
      // For each duplicate group, keep the oldest (first created) and delete the rest
      for (const group of duplicateGroups) {
        // Sort by created_at to keep the oldest
        const sorted = group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const toDelete = sorted.slice(1); // Delete all except the first (oldest)
        
        for (const task of toDelete) {
          const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);
            
          if (deleteError) {
            console.error(`Error deleting duplicate task ${task.id}:`, deleteError);
          } else {
            console.log(`Deleted duplicate task: ${task.title} (${task.id})`);
            deletedCount++;
          }
        }
      }

      toast({
        title: "Cleanup Complete",
        description: `Deleted ${deletedCount} duplicate recurring tasks.`
      });

    } catch (error: any) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Cleanup Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecurringTaskStats = async () => {
    try {
      setIsLoading(true);
      
      // Get recurring task statistics
      const { data: recurringParents } = await supabase
        .from('tasks')
        .select('id, title, recurring_frequency, original_task_name')
        .eq('is_recurring', true)
        .is('parent_task_id', null);

      const { data: recurringInstances } = await supabase
        .from('tasks')
        .select('id, title, parent_task_id, recurrence_count_in_period, status')
        .not('parent_task_id', 'is', null);

      setDebugInfo({
        parentTasks: recurringParents?.length || 0,
        instanceTasks: recurringInstances?.length || 0,
        parentDetails: recurringParents || [],
        instanceDetails: recurringInstances || []
      });

      toast({
        title: "Debug Info Updated",
        description: "Recurring task statistics refreshed."
      });

    } catch (error: any) {
      console.error("Error getting stats:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testRecurringGeneration = async () => {
    try {
      setIsLoading(true);
      
      // Find a completed recurring task to test with
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('id, title, parent_task_id, is_recurring')
        .eq('status', 'completed')
        .or('is_recurring.eq.true,parent_task_id.not.is.null')
        .limit(1);

      if (!completedTasks || completedTasks.length === 0) {
        toast({
          title: "No Test Task",
          description: "No completed recurring tasks found to test with."
        });
        return;
      }

      const testTask = completedTasks[0];
      console.log("Testing recurring generation with task:", testTask);      const { data: result, error } = await supabase
        .rpc('complete_task_and_generate_next', { task_id: testTask.id });

      if (error) {
        throw error;
      }

      if (result?.success && result.new_recurring_task_id) {
        toast({
          title: "Test Successful",
          description: `Generated new task ID: ${result.new_recurring_task_id}`
        });
      } else {
        toast({
          title: "Test Result",
          description: result?.message || "No new task generated (conditions not met or duplicate prevented)"
        });
      }

    } catch (error: any) {
      console.error("Error testing generation:", error);
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Recurring Task Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={cleanupDuplicateTasks}
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Duplicates
          </Button>
          
          <Button
            onClick={getRecurringTaskStats}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Get Stats
          </Button>
          
          <Button
            onClick={testRecurringGeneration}
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            Test Generation
          </Button>
        </div>

        {debugInfo && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Parent Tasks:</strong>
              <Badge variant="outline" className="ml-2">
                {debugInfo.parentTasks}
              </Badge>
            </div>
            <div>
              <strong>Instance Tasks:</strong>
              <Badge variant="outline" className="ml-2">
                {debugInfo.instanceTasks}
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Updated Logic:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sequential counting: D1 → D2 → D3 (no duplicates)</li>
            <li>Proper time validation: Daily (1+ days), Weekly (7+ days)</li>
            <li>Enhanced duplicate prevention by count number</li>
            <li>Improved logging for debugging</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskRecurringDebugPanel;
