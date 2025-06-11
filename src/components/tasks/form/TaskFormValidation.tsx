
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface TaskFormValidationProps {
  isRecurring: boolean;
  startDate: string | null;
  endDate: string | null;
  recurringFrequency: string;
  mode?: 'create' | 'edit' | 'status-update';
}

export const TaskFormValidation: React.FC<TaskFormValidationProps> = ({
  isRecurring,
  startDate,
  endDate,
  recurringFrequency,
  mode = 'create'
}) => {
  if (!isRecurring) return null;

  const hasRequiredFields = startDate && endDate && recurringFrequency;
  const hasValidDates = startDate && endDate && new Date(endDate) > new Date(startDate);

  // For status updates, show more helpful messages
  if (mode === 'status-update') {
    if (!hasRequiredFields) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recurring Task Error:</strong> This task is missing required recurring data. 
            The system will fetch complete data from the database automatically.
          </AlertDescription>
        </Alert>
      );
    }

    if (hasRequiredFields && hasValidDates) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Recurring Task Valid:</strong> All recurring settings are properly configured.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return (
    <div className="space-y-2">
      {!hasRequiredFields && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required Fields Missing:</strong> All recurring task fields (frequency, start date, end date) are required
          </AlertDescription>
        </Alert>
      )}
      
      {hasRequiredFields && !hasValidDates && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Invalid Date Range:</strong> End date must be after start date
          </AlertDescription>
        </Alert>
      )}
      
      {hasRequiredFields && hasValidDates && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Valid Configuration:</strong> Recurring task setup is correct. Backend automation will handle instance generation.
          </AlertDescription>
        </Alert>
      )}
      
      {mode !== 'status-update' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Backend Automation:</strong> New recurring task instances will be automatically 
            created when the previous instance is marked as completed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
