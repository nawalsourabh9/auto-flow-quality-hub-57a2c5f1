import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCcw, Play, Bug } from 'lucide-react';

interface AutomationResult {
  overdueUpdated: number;
  recurringCreated: number;
  errors: string[];
}

export const TaskAutomationDebugPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutomationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  const runAutomation = async () => {
    try {
      setIsRunning(true);
      addLog("🔄 Starting task automation...");

      // Call the Edge Function directly
      const { data, error } = await supabase.functions.invoke('task-automation', {
        body: { manual: true, debug: true }
      });

      if (error) {
        addLog(`❌ Error: ${error.message}`);
        toast({
          title: "Automation Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data?.results) {
        setLastResult(data.results);
        addLog(`✅ Automation completed:`);
        addLog(`   • Overdue tasks marked: ${data.results.overdueUpdated}`);
        addLog(`   • Recurring tasks created: ${data.results.recurringCreated}`);
        if (data.results.errors.length > 0) {
          addLog(`   • Errors: ${data.results.errors.length}`);
          data.results.errors.forEach((err: string) => addLog(`     - ${err}`));
        }

        toast({
          title: "Automation Complete",
          description: `Created ${data.results.recurringCreated} recurring tasks, marked ${data.results.overdueUpdated} overdue`
        });
      }

    } catch (error: any) {
      addLog(`💥 Exception: ${error.message}`);
      toast({
        title: "Automation Failed", 
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const checkCompletedTasks = async () => {
    try {
      addLog("🔍 Checking completed recurring tasks...");
      
      const { data: completedTasks, error } = await supabase
        .from('tasks')
        .select(`
          id, title, status, is_recurring, parent_task_id, 
          recurring_frequency, due_date, created_at
        `)
        .eq('status', 'completed')
        .or('is_recurring.eq.true,parent_task_id.not.is.null');

      if (error) {
        addLog(`❌ Query error: ${error.message}`);
        return;
      }

      addLog(`📋 Found ${completedTasks?.length || 0} completed recurring tasks:`);
      completedTasks?.forEach(task => {
        const type = task.is_recurring ? 'Parent' : 'Child';
        addLog(`   • ${type}: "${task.title}" (${task.due_date})`);
      });

    } catch (error: any) {
      addLog(`💥 Check failed: ${error.message}`);
    }
  };

  const testSingleTask = async () => {
    try {
      addLog("🧪 Testing single task completion...");
      
      // Get a completed recurring task
      const { data: task, error } = await supabase
        .from('tasks')
        .select('id, title, is_recurring, parent_task_id')
        .eq('status', 'completed')
        .or('is_recurring.eq.true,parent_task_id.not.is.null')
        .limit(1)
        .single();

      if (error || !task) {
        addLog("❌ No completed recurring task found for testing");
        return;
      }

      addLog(`🎯 Testing with task: "${task.title}"`);

      const { data: result, error: rpcError } = await supabase
        .rpc('complete_task_and_generate_next', { task_id: task.id });

      if (rpcError) {
        addLog(`❌ RPC Error: ${rpcError.message}`);
      } else {
        addLog(`✅ Result: ${JSON.stringify(result)}`);
      }

    } catch (error: any) {
      addLog(`💥 Test failed: ${error.message}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Task Automation Debug Panel
        </CardTitle>
        <CardDescription>
          Debug and test recurring task automation system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runAutomation} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Full Automation
          </Button>
          
          <Button variant="outline" onClick={checkCompletedTasks}>
            Check Completed Tasks
          </Button>
          
          <Button variant="outline" onClick={testSingleTask}>
            Test Single Task
          </Button>
          
          <Button variant="outline" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {lastResult.overdueUpdated}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Overdue Marked</p>
            </div>
            <div className="text-center">
              <Badge variant="default" className="text-lg px-3 py-1">
                {lastResult.recurringCreated}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Tasks Created</p>
            </div>
            <div className="text-center">
              <Badge variant={lastResult.errors.length > 0 ? "destructive" : "secondary"} className="text-lg px-3 py-1">
                {lastResult.errors.length}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Errors</p>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="border rounded-lg p-3 bg-muted/30 max-h-60 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Activity Log:</div>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Run automation to see logs.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono break-all">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
