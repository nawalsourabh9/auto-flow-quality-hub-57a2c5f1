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

  const createCompatibilityFunctions = async () => {
    try {
      addLog("🔧 Creating compatibility functions...");
      
      // Read the compatibility SQL file content
      const compatibilitySQL = `
-- Compatibility functions for recurring task generation
CREATE OR REPLACE FUNCTION complete_task_and_generate_next(task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
    result JSONB;
BEGIN
    SELECT * INTO task_record FROM tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Task not found', 'completed_task_id', task_id, 'new_recurring_task_id', null);
    END IF;
    
    IF task_record.status = 'completed' THEN
        IF task_record.is_recurring = true OR task_record.parent_task_id IS NOT NULL THEN
            IF task_record.recurring_frequency = 'daily' THEN
                next_due_date := task_record.due_date + INTERVAL '1 day';
            ELSIF task_record.recurring_frequency = 'weekly' THEN
                next_due_date := task_record.due_date + INTERVAL '1 week';
            ELSIF task_record.recurring_frequency = 'biweekly' THEN
                next_due_date := task_record.due_date + INTERVAL '2 weeks';
            ELSIF task_record.recurring_frequency = 'monthly' THEN
                next_due_date := task_record.due_date + INTERVAL '1 month';
            ELSIF task_record.recurring_frequency = 'quarterly' THEN
                next_due_date := task_record.due_date + INTERVAL '3 months';
            ELSIF task_record.recurring_frequency = 'annually' THEN
                next_due_date := task_record.due_date + INTERVAL '1 year';
            ELSE
                next_due_date := NULL;
            END IF;
            
            IF next_due_date IS NOT NULL AND next_due_date <= CURRENT_DATE THEN
                INSERT INTO tasks (title, description, priority, department, assignee, status, due_date, is_recurring, recurring_frequency, parent_task_id, start_date, end_date, is_customer_related, customer_name, created_at, updated_at)
                VALUES (task_record.title, task_record.description, task_record.priority, task_record.department, task_record.assignee, 'not-started', next_due_date, false, task_record.recurring_frequency, 
                        CASE WHEN task_record.parent_task_id IS NOT NULL THEN task_record.parent_task_id ELSE task_record.id END,
                        task_record.start_date, task_record.end_date, task_record.is_customer_related, task_record.customer_name, NOW(), NOW())
                RETURNING id INTO new_task_id;
                
                RETURN jsonb_build_object('success', true, 'message', 'Task completed and new instance generated', 'completed_task_id', task_id, 'new_recurring_task_id', new_task_id);
            ELSE
                RETURN jsonb_build_object('success', true, 'message', 'Task completed, no new instance needed', 'completed_task_id', task_id, 'new_recurring_task_id', null);
            END IF;
        ELSE
            RETURN jsonb_build_object('success', true, 'message', 'Task completed, not recurring', 'completed_task_id', task_id, 'new_recurring_task_id', null);
        END IF;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Task is not completed', 'completed_task_id', task_id, 'new_recurring_task_id', null);
    END IF;
    
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM, 'completed_task_id', task_id, 'new_recurring_task_id', null);
END;
$$;

CREATE OR REPLACE FUNCTION mark_tasks_overdue_simple()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE tasks 
    SET status = 'overdue', updated_at = NOW()
    WHERE due_date < CURRENT_DATE
      AND status IN ('not-started', 'in-progress')
      AND (is_recurring IS FALSE OR is_recurring IS NULL)
      AND (parent_task_id IS NOT NULL OR is_recurring IS FALSE);
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

-- Create the old function that the Edge Function expects
CREATE OR REPLACE FUNCTION generate_next_recurring_task(completed_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    task_record tasks%ROWTYPE;
    new_task_id UUID;
    next_due_date DATE;
BEGIN
    SELECT * INTO task_record FROM tasks WHERE id = completed_task_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Task not found', 'task_id', completed_task_id);
    END IF;
    
    IF task_record.is_recurring = true OR task_record.parent_task_id IS NOT NULL THEN
        IF task_record.recurring_frequency = 'daily' THEN
            next_due_date := task_record.due_date + INTERVAL '1 day';
        ELSIF task_record.recurring_frequency = 'weekly' THEN
            next_due_date := task_record.due_date + INTERVAL '1 week';
        ELSIF task_record.recurring_frequency = 'biweekly' THEN
            next_due_date := task_record.due_date + INTERVAL '2 weeks';
        ELSIF task_record.recurring_frequency = 'monthly' THEN
            next_due_date := task_record.due_date + INTERVAL '1 month';
        ELSIF task_record.recurring_frequency = 'quarterly' THEN
            next_due_date := task_record.due_date + INTERVAL '3 months';
        ELSIF task_record.recurring_frequency = 'annually' THEN
            next_due_date := task_record.due_date + INTERVAL '1 year';
        ELSE
            next_due_date := NULL;
        END IF;
        
        IF next_due_date IS NOT NULL AND next_due_date <= CURRENT_DATE THEN
            INSERT INTO tasks (title, description, priority, department, assignee, status, due_date, is_recurring, recurring_frequency, parent_task_id, start_date, end_date, is_customer_related, customer_name, created_at, updated_at)
            VALUES (task_record.title, task_record.description, task_record.priority, task_record.department, task_record.assignee, 'not-started', next_due_date, false, task_record.recurring_frequency, 
                    CASE WHEN task_record.parent_task_id IS NOT NULL THEN task_record.parent_task_id ELSE task_record.id END,
                    task_record.start_date, task_record.end_date, task_record.is_customer_related, task_record.customer_name, NOW(), NOW())
            RETURNING id INTO new_task_id;
            
            RETURN jsonb_build_object('success', true, 'message', 'Next recurring task created', 'task_id', new_task_id);
        ELSE
            RETURN jsonb_build_object('success', true, 'message', 'No new task needed', 'task_id', null);
        END IF;
    ELSE
        RETURN jsonb_build_object('success', true, 'message', 'Task is not recurring', 'task_id', null);
    END IF;
    
EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM, 'task_id', null);
END;
$$;

GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_next_recurring_task(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_and_generate_next(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_tasks_overdue_simple() TO service_role;
GRANT EXECUTE ON FUNCTION generate_next_recurring_task(UUID) TO service_role;
      `;

      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: compatibilitySQL 
      });

      if (error) {
        addLog(`❌ Function creation failed: ${error.message}`);
        toast({
          title: "Function Creation Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addLog("✅ Compatibility functions created successfully!");
        toast({
          title: "Success",
          description: "Compatibility functions have been created"
        });
      }

    } catch (error: any) {
      addLog(`💥 Function creation failed: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to create compatibility functions",
        variant: "destructive"
      });
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

          <Button variant="secondary" onClick={createCompatibilityFunctions}>
            🔧 Create Functions
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
