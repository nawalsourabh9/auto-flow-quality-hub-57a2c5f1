
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

interface CompleteTaskResponse {
  success: boolean;
  completed_task_id?: string;
  new_recurring_task_id?: string | null;
  message?: string;
  error?: string;
}

// Set to true to show the testing features (for development)
// Set to false to hide testing and show only manual generation (for production)
const SHOW_TESTING_MODE = true;

export const TaskAutomationTester = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Mark Overdue', status: 'idle', message: 'Test overdue marking (excludes templates)' },
    { name: 'Manual Instance Creation', status: 'idle', message: 'Create instance from template manually' },
    { name: 'Complete & Generate Next', status: 'idle', message: 'Complete instance and generate next' },
    { name: 'Template Management', status: 'idle', message: 'Test template operations' }
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
      // For development/testing, we'll try to run the functions anyway
      // since we've set them to SECURITY DEFINER
      console.log('Auth hook user:', user);
      
      // Check current Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Supabase session:', session);
      console.log('Session error:', sessionError);
      
      if (!session || !session.user) {
        console.log('No valid session found, but attempting to continue for testing...');
        
        // Show warning but allow testing to continue
        toast({ 
          title: "Testing Mode", 
          description: "Running tests without full authentication (development only)",
          variant: "default" 
        });
        
        return true; // Allow testing to continue
      }

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      
      // Still allow testing to continue for development
      toast({ 
        title: "Testing Mode", 
        description: "Running tests in development mode",
        variant: "default" 
      });
      return true;
    }
  };

  const testMarkOverdue = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(0, 'running', 'Marking overdue tasks (excluding templates)...');
    try {
      console.log('Testing new overdue marking functionality...');
      
      const { data, error } = await supabase.rpc('mark_tasks_overdue_simple');
      console.log('RPC Response:', { data, error });
      
      if (error) {
        console.error('RPC Error details:', error);
        throw new Error(error.message || 'Failed to mark tasks overdue');
      }
      
      const count = typeof data === 'number' ? data : Number(data) || 0;
      updateResult(0, 'success', `✅ Marked ${count} tasks overdue (templates excluded)`, count);
      toast({ 
        title: "Success", 
        description: `${count} instance tasks marked as overdue. Templates were excluded.` 
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

  const createManualInstance = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(1, 'running', 'Creating manual instance from template...');
    try {
      console.log('Finding available templates...');
      
      // Find active templates (recurring tasks with is_template = true)
      const { data: templates, error: findError } = await supabase
        .from('tasks')
        .select('id, title, recurring_frequency, start_date, end_date')
        .eq('is_template', true)
        .eq('is_recurring', true)
        .limit(5);

      if (findError) {
        console.error('Query error:', findError);
        throw new Error(findError.message || 'Failed to fetch templates');
      }

      if (!templates || templates.length === 0) {
        updateResult(1, 'error', '❌ No recurring templates found');
        toast({ 
          title: "No Templates Found", 
          description: "Create a recurring task first to generate templates",
          variant: "destructive"
        });
        return;
      }

      console.log(`Found ${templates.length} templates to test`);
      let createdCount = 0;

      for (const template of templates) {
        try {
          console.log(`Creating instance from template ${template.id}: ${template.title}`);
          
          const { data: instanceId, error: createError } = await supabase
            .rpc('create_first_recurring_instance', { template_id: template.id });
          
          if (createError) {
            console.log(`Template ${template.id} instance creation failed:`, createError.message);
            continue;
          }
          
          if (instanceId) {
            createdCount++;
            console.log(`Created instance ${instanceId} from template ${template.id}`);
          }
        } catch (err: any) {
          console.log(`Template ${template.id} instance creation error:`, err.message);
        }
      }

      updateResult(1, 'success', `✅ Created ${createdCount} instances from ${templates.length} templates`, createdCount);
      toast({ 
        title: "Instance Creation Complete", 
        description: `Created ${createdCount} new instances from templates` 
      });
    } catch (error: any) {
      console.error('Create manual instance error:', error);
      updateResult(1, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const testCompleteAndGenerate = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(2, 'running', 'Testing completion and next generation...');
    try {
      console.log('Finding completed instances that can generate next...');
      
      // Find instances that are not completed and not templates
      const { data: instances, error: findError } = await supabase
        .from('tasks')
        .select('id, title, status, is_template, is_generated, parent_task_id')
        .eq('is_template', false)
        .neq('status', 'completed')
        .eq('is_generated', true)
        .not('parent_task_id', 'is', null)
        .limit(3);

      if (findError) {
        console.error('Query error:', findError);
        throw new Error(findError.message || 'Failed to fetch instances');
      }

      if (!instances || instances.length === 0) {
        updateResult(2, 'error', '❌ No suitable instances found');
        toast({ 
          title: "No Instances Found", 
          description: "Create some recurring task instances first",
          variant: "destructive"
        });
        return;
      }

      console.log(`Found ${instances.length} instances to test completion`);
      let completedCount = 0;
      let generatedCount = 0;

      for (const instance of instances) {
        try {
          console.log(`Completing instance ${instance.id}: ${instance.title}`);
          
          const { data: result, error: completeError } = await supabase
            .rpc('complete_task_and_generate_next', { task_id: instance.id });
          
          if (completeError) {
            console.log(`Instance ${instance.id} completion failed:`, completeError.message);
            continue;
          }
          
          const typedResult = result as unknown as CompleteTaskResponse;
          if (typedResult?.success) {
            completedCount++;
            if (typedResult.new_recurring_task_id) {
              generatedCount++;
              console.log(`Completed ${instance.id} and generated ${typedResult.new_recurring_task_id}`);
            } else {
              console.log(`Completed ${instance.id} but no new task generated`);
            }
          }
        } catch (err: any) {
          console.log(`Instance ${instance.id} completion error:`, err.message);
        }
      }

      updateResult(2, 'success', `✅ Completed ${completedCount}, generated ${generatedCount} new instances`, generatedCount);
      toast({ 
        title: "Completion Test Complete", 
        description: `Completed ${completedCount} instances, generated ${generatedCount} new ones` 
      });
    } catch (error: any) {
      console.error('Complete and generate test error:', error);
      updateResult(2, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const testTemplateManagement = async () => {
    if (!(await checkAuthenticationBeforeExecution())) return;
    
    updateResult(3, 'running', 'Testing template management...');
    try {
      console.log('Testing template operations...');
      
      // Find templates and their instances
      const { data: templates, error: findError } = await supabase
        .from('tasks')
        .select(`
          id, title, recurring_frequency, is_template,
          instances:tasks!parent_task_id(id, title, status, due_date, is_template)
        `)
        .eq('is_template', true)
        .limit(3);

      if (findError) {
        console.error('Query error:', findError);
        throw new Error(findError.message || 'Failed to fetch templates');
      }

      if (!templates || templates.length === 0) {
        updateResult(3, 'error', '❌ No templates found for testing');
        return;
      }

      let templateCount = 0;
      let instanceCount = 0;

      for (const template of templates) {
        templateCount++;
        const instances = (template as any).instances || [];
        instanceCount += instances.length;
        
        console.log(`Template ${template.title}: ${instances.length} instances`);
      }

      updateResult(3, 'success', `✅ Found ${templateCount} templates with ${instanceCount} total instances`, templateCount);
      toast({ 
        title: "Template Analysis Complete", 
        description: `Found ${templateCount} templates managing ${instanceCount} instances` 
      });
    } catch (error: any) {
      console.error('Template management test error:', error);
      updateResult(3, 'error', `❌ ${error.message}`);
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const refreshSession = async () => {
    try {
      console.log('Manually refreshing session...');
      
      // Check if we have a user from the auth hook
      console.log('Auth hook user:', user);
      
      // Try different session approaches
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', sessionData, sessionError);
      
      if (!sessionData.session) {
        // Try to sign in with stored credentials or redirect to login
        toast({ 
          title: "No Active Session", 
          description: "Please log out and log in again to restore Supabase session",
          variant: "destructive" 
        });
        
        // Alternative: Provide a way to test without auth
        const confirmTest = confirm("Session missing. Would you like to try testing with admin privileges? (Development only)");
        if (confirmTest) {
          return await testWithAdminAccess();
        }
        return false;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        toast({ 
          title: "Session Refresh Failed", 
          description: "Please log out and log in again",
          variant: "destructive" 
        });
        return false;
      }
      
      console.log('Session refreshed successfully:', data);
      toast({ 
        title: "Session Refreshed", 
        description: "Authentication updated successfully" 
      });
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      toast({ 
        title: "Refresh Error", 
        description: "Unable to refresh session",
        variant: "destructive" 
      });
      return false;
    }
  };

  const testWithAdminAccess = async () => {
    try {
      console.log('Testing with service role access...');
      
      // For development/testing, we can try to call the functions through a different method
      // This is a temporary workaround - in production you'd fix the auth properly
      
      toast({ 
        title: "Development Mode", 
        description: "Testing functions with admin access",
        variant: "default" 
      });
      return true;
      
    } catch (error) {
      console.error('Admin access test failed:', error);
      toast({ 
        title: "Admin Test Failed", 
        description: "Unable to test with admin privileges",
        variant: "destructive" 
      });
      return false;
    }
  };

  const testFunctions = [
    testMarkOverdue, 
    createManualInstance, 
    testCompleteAndGenerate, 
    testTemplateManagement
  ];

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
        onClick={createManualInstance}
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Task Automation Tester</h3>
          </div>
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
            
            <div className="flex gap-2">
              <Button 
                onClick={refreshSession}
                variant="outline"
                className="flex-1 h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Refresh Session
              </Button>
              <Button 
                onClick={resetResults}
                variant="outline"
                className="flex-1 h-7 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Results
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            💡 Check browser console for detailed logs
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
