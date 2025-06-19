
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

interface CompleteTaskResponse {
  success: boolean;
  completed_task_id?: string;
  new_recurring_task_id?: string | null;
  message?: string;
  error?: string;
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
      addLog("🔍 Checking templates and instances...");
      
      // Check templates
      const { data: templates, error: templateError } = await supabase
        .from('tasks')
        .select('id, title, recurring_frequency, is_template, is_generated')
        .eq('is_template', true)
        .eq('is_recurring', true);

      if (templateError) {
        addLog(`❌ Template query error: ${templateError.message}`);
        return;
      }

      addLog(`📋 Found ${templates?.length || 0} recurring templates`);
      
      // Check instances
      const { data: instances, error: instanceError } = await supabase
        .from('tasks')
        .select('id, title, status, is_template, is_generated, parent_task_id, due_date')
        .eq('is_template', false)
        .not('parent_task_id', 'is', null);

      if (instanceError) {
        addLog(`❌ Instance query error: ${instanceError.message}`);
        return;
      }

      addLog(`📋 Found ${instances?.length || 0} task instances`);
      
      instances?.forEach(instance => {
        const status = instance.status || 'pending';
        const generated = instance.is_generated ? 'auto' : 'manual';
        addLog(`   • Instance: "${instance.title}" (${status}, ${generated})`);
      });

    } catch (error: any) {
      addLog(`💥 Check failed: ${error.message}`);
    }
  };

  const testSingleTask = async () => {
    try {
      addLog("🧪 Testing single instance completion...");
      
      // Get an active instance (not template, not completed)
      const { data: instance, error } = await supabase
        .from('tasks')
        .select('id, title, status, is_template, is_generated, parent_task_id')
        .eq('is_template', false)
        .neq('status', 'completed')
        .not('parent_task_id', 'is', null)
        .limit(1)
        .single();

      if (error || !instance) {
        addLog("❌ No active task instance found for testing");
        addLog("💡 Try creating an instance first using 'Manual Instance Creation'");
        return;
      }

      addLog(`🎯 Testing completion of instance: "${instance.title}"`);
      addLog(`   Instance ID: ${instance.id}, Generated: ${instance.is_generated ? 'auto' : 'manual'}`);

      const { data: result, error: rpcError } = await supabase
        .rpc('complete_task_and_generate_next', { task_id: instance.id });

      if (rpcError) {
        addLog(`❌ RPC Error: ${rpcError.message}`);
      } else {
        addLog(`✅ Result: ${JSON.stringify(result)}`);
        const typedResult = result as unknown as CompleteTaskResponse;
        if (typedResult?.success) {
          addLog(`✅ Task completed successfully`);
          if (typedResult.new_recurring_task_id) {
            addLog(`✅ New instance generated: ${typedResult.new_recurring_task_id}`);
          } else {
            addLog(`ℹ️ No new instance generated (may not meet criteria)`);
          }
        }
      }

    } catch (error: any) {
      addLog(`💥 Test failed: ${error.message}`);
    }
  };

  const testTemplateInstanceCreation = async () => {
    try {
      addLog("🧪 Testing template instance creation...");
      
      // Get a template
      const { data: template, error } = await supabase
        .from('tasks')
        .select('id, title, recurring_frequency')
        .eq('is_template', true)
        .eq('is_recurring', true)
        .limit(1)
        .single();

      if (error || !template) {
        addLog("❌ No recurring template found for testing");
        addLog("💡 Try creating a recurring task first");
        return;
      }

      addLog(`🎯 Testing instance creation from template: "${template.title}"`);

      const { data: instanceId, error: rpcError } = await supabase
        .rpc('create_first_recurring_instance', { template_id: template.id });

      if (rpcError) {
        addLog(`❌ RPC Error: ${rpcError.message}`);
      } else if (instanceId) {
        addLog(`✅ Created new instance: ${instanceId}`);
      } else {
        addLog(`ℹ️ No instance created (may already exist or other condition)`);
      }

    } catch (error: any) {
      addLog(`💥 Test failed: ${error.message}`);
    }
  };

  const createCompatibilityFunctions = async () => {
    try {
      addLog("🔧 Creating compatibility functions...");
      
      // Since exec_sql doesn't exist, let's use a workaround
      // We'll manually trigger the migration using the terminal
      addLog("⚠️ Cannot execute SQL directly from frontend");
      addLog("📋 Please run this command in your terminal:");
      addLog("   supabase db push");
      addLog("   OR copy the SQL from 20250618_compatibility_functions.sql");
      addLog("   and execute it in your database directly");
        toast({
        title: "Manual Step Required",
        description: "Please apply the migration manually using 'supabase db push' or execute the SQL directly in your database",
        variant: "default"
      });

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
            Check Templates & Instances
          </Button>
          
          <Button variant="outline" onClick={testTemplateInstanceCreation}>
            Test Instance Creation
          </Button>
          
          <Button variant="outline" onClick={testSingleTask}>
            Test Instance Completion
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
