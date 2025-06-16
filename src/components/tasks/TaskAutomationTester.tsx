import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  TestTube, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  RotateCcw,
  Zap,
  UserX
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  count?: number;
}

// Set to true to show the testing features (for development)
// Set to false to hide testing and show only manual generation (for production)
const SHOW_TESTING_MODE = true;

export const TaskAutomationTester = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Mark Overdue', status: 'idle', message: 'Test overdue marking' },
    { name: 'Generate Recurring', status: 'idle', message: 'Generate next recurring tasks' },
    { name: 'Full Automation', status: 'idle', message: 'Run complete automation' }
  ]);

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const updateResult = (index: number, status: TestResult['status'], message: string, count?: number) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message, count } : result
    ));
  };

  const checkAuthenticationBeforeExecution = async (): Promise<boolean> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast({ 
          title: "Authentication Error", 
          description: "Please log in to use this feature",
          variant: "destructive" 
        });
        return false;
      }
      
      if (!session || !session.user) {
        toast({ 
          title: "Not Authenticated", 
          description: "Please log in to use automation features",
          variant: "destructive" 
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      toast({ 
        title: "Authentication Error", 
        description: "Unable to verify authentication",
        variant: "destructive" 
      });
      return false;
    }
  };

  const testMarkOverdue = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(0, 'running', 'Marking overdue tasks...');
    try {
      console.log('Testing mark overdue functionality...');
      
      const { data, error } = await supabase.rpc('mark_tasks_overdue');
      console.log('RPC Response:', { data, error });
      
      if (error) {
        console.error('RPC Error details:', error);
        throw new Error(error.message || 'Failed to mark tasks overdue');
      }
      
      const count = typeof data === 'number' ? data : Number(data) || 0;
      updateResult(0, 'success', `✅ Marked ${count} tasks overdue`, count);
      toast({ 
        title: "Success", 
        description: `${count} tasks marked as overdue` 
      });
    } catch (error: any) {
      console.error('Mark overdue error:', error);
      updateResult(0, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const generateRecurringTasks = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(1, 'running', 'Generating recurring tasks...');
    try {
      console.log('Starting recurring task generation...');
      
      // Find completed recurring tasks
      const { data: completedTasks, error: findError } = await supabase
        .from('tasks')
        .select('id, title, is_recurring, parent_task_id, status')
        .eq('status', 'completed')
        .or('is_recurring.eq.true,parent_task_id.not.is.null')
        .limit(10);

      if (findError) {
        console.error('Query error:', findError);
        throw new Error(findError.message || 'Failed to fetch completed tasks');
      }

      if (!completedTasks || completedTasks.length === 0) {
        updateResult(1, 'error', '❌ No completed recurring tasks found');
        toast({ 
          title: "No Tasks Found", 
          description: "No completed recurring tasks available for generation",
          variant: "destructive"
        });
        return;
      }

      console.log(`Found ${completedTasks.length} completed tasks to process`);

      let generatedCount = 0;
      let processedCount = 0;

      for (const task of completedTasks) {
        try {
          processedCount++;
          console.log(`Processing task ${task.id}: ${task.title}`);
          
          const { data: newTaskId, error: genError } = await supabase
            .rpc('generate_next_recurring_task', { completed_task_id: task.id });
          
          if (genError) {
            console.log(`Task ${task.id} generation failed:`, genError.message);
            continue;
          }
          
          if (newTaskId) {
            generatedCount++;
            console.log(`Generated new task ${newTaskId} from parent ${task.id}`);
          } else {
            console.log(`Task ${task.id} - no new task needed (conditions not met)`);
          }
        } catch (err: any) {
          console.log(`Task ${task.id} generation error:`, err.message);
        }
      }

      updateResult(1, 'success', `✅ Generated ${generatedCount}/${processedCount} new tasks`, generatedCount);
      toast({ 
        title: "Generation Complete", 
        description: `Generated ${generatedCount} new recurring tasks from ${processedCount} completed tasks` 
      });
    } catch (error: any) {
      console.error('Generate recurring tasks error:', error);
      updateResult(1, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const runFullAutomation = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(2, 'running', 'Running full automation...');
    try {
      console.log('Starting full automation...');
      
      // Run overdue check first
      const { data: overdueCount, error: overdueError } = await supabase.rpc('mark_tasks_overdue');
      if (overdueError) {
        console.error('Overdue marking error:', overdueError);
        throw new Error(overdueError.message || 'Failed to mark overdue tasks');
      }

      // Run recurring generation
      const { data: completedTasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('status', 'completed')
        .or('is_recurring.eq.true,parent_task_id.not.is.null')
        .limit(10);

      let generatedCount = 0;
      if (completedTasks && completedTasks.length > 0) {
        for (const task of completedTasks) {
          try {
            const { data: newTaskId } = await supabase
              .rpc('generate_next_recurring_task', { completed_task_id: task.id });
            if (newTaskId) generatedCount++;
          } catch (err) {
            // Silent fail for individual tasks that don't meet generation criteria
            console.log('Individual task generation skipped:', err);
          }
        }
      }

      const totalOverdue = typeof overdueCount === 'number' ? overdueCount : Number(overdueCount) || 0;
      updateResult(2, 'success', `✅ Overdue: ${totalOverdue}, Generated: ${generatedCount}`, totalOverdue + generatedCount);
      toast({ 
        title: "Full Automation Complete", 
        description: `Marked ${totalOverdue} overdue tasks, generated ${generatedCount} new recurring tasks` 
      });
    } catch (error: any) {
      console.error('Full automation error:', error);
      updateResult(2, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const testFunctions = [testMarkOverdue, generateRecurringTasks, runFullAutomation];

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      idle: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive'
    } as const;

    return (
      <Badge 
        variant={variants[status]}
        className={status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const resetResults = () => {
    setResults([
      { name: 'Mark Overdue', status: 'idle', message: 'Test overdue marking' },
      { name: 'Generate Recurring', status: 'idle', message: 'Generate next recurring tasks' },
      { name: 'Full Automation', status: 'idle', message: 'Run complete automation' }
    ]);
  };

  // Production mode - show only manual generation button
  if (!SHOW_TESTING_MODE) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="gap-2"
        onClick={generateRecurringTasks}
        disabled={results[1].status === 'running'}
      >
        {results[1].status === 'running' ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        Generate Recurring Tasks
      </Button>
    );
  }

  // Development/Testing mode - show full testing interface
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test Automation
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Task Automation Testing
          </div>
          
          <div className="text-xs text-muted-foreground">
            Test recurring task automation functions manually
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={result.name} className="flex items-center justify-between p-2 border rounded text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusBadge(result.status)}
                  <Button
                    onClick={testFunctions[index]}
                    disabled={result.status === 'running'}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                  >
                    {result.status === 'running' ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t space-y-2">
            <Button 
              onClick={() => testFunctions.forEach(fn => fn())}
              className="w-full h-7 text-xs"
              disabled={results.some(r => r.status === 'running')}
            >
              <Play className="h-3 w-3 mr-1" />
              Run All Tests
            </Button>
            
            <Button 
              onClick={resetResults}
              variant="outline"
              className="w-full h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Results
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            💡 Check browser console for detailed logs
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
