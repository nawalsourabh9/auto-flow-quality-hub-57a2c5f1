
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDateForInput } from "@/utils/dateUtils";

interface StatusUpdateDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
}

const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask
}) => {
  const [status, setStatus] = useState<'not-started' | 'in-progress' | 'completed' | 'overdue'>('not-started');
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fullTaskData, setFullTaskData] = useState<Task | null>(null);

  // Fetch complete task data when dialog opens
  useEffect(() => {
    const fetchCompleteTaskData = async () => {
      if (!task?.id || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', task.id)
          .single();

        if (error) {
          console.error('Error fetching complete task data:', error);
          return;
        }

        // Convert database format to Task format
        const completeTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          department: data.department,
          priority: data.priority as 'low' | 'medium' | 'high',
          dueDate: data.due_date,
          assignee: data.assignee || 'unassigned',
          status: data.status as 'completed' | 'in-progress' | 'overdue' | 'not-started',
          createdAt: data.created_at,
          isRecurring: data.is_recurring || false,
          recurringFrequency: data.recurring_frequency,
          startDate: data.start_date,
          endDate: data.end_date,
          isCustomerRelated: data.is_customer_related || false,
          customerName: data.customer_name,
          attachmentsRequired: data.attachments_required as 'none' | 'optional' | 'required',
          comments: data.comments || ''
        };

        setFullTaskData(completeTask);
        setStatus(completeTask.status);
        setComments(completeTask.comments || '');
      } catch (error) {
        console.error('Error fetching task data:', error);
        toast({
          title: "Error",
          description: "Failed to load complete task data",
          variant: "destructive"
        });
      }
    };

    fetchCompleteTaskData();
  }, [task?.id, isOpen]);

  const handleSubmit = async () => {
    if (!fullTaskData) return;

    setIsLoading(true);
    try {
      const updatedTask: Task = {
        ...fullTaskData,
        status,
        comments
      };

      console.log('Updating task status with complete data:', updatedTask);
      await onUpdateTask(updatedTask);
      onClose();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStatus('not-started');
    setComments('');
    setFullTaskData(null);
    onClose();
  };

  if (!fullTaskData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-medium mb-2">{fullTaskData.title}</h3>
            <p className="text-sm text-muted-foreground">{fullTaskData.description}</p>
            {fullTaskData.isRecurring && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <strong>Recurring Task:</strong> {fullTaskData.recurringFrequency} 
                {fullTaskData.startDate && fullTaskData.endDate && (
                  <span> ({formatDateForInput(fullTaskData.startDate)} to {formatDateForInput(fullTaskData.endDate)})</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comments (Optional)</label>
            <Textarea
              placeholder="Add any comments about the status update..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;
