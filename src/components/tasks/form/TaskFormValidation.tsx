
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface TaskFormValidationProps {
  isRecurring: boolean;
  startDate: string;
  endDate: string;
  recurringFrequency: string;
}

export const TaskFormValidation: React.FC<TaskFormValidationProps> = ({
  isRecurring,
  startDate,
  endDate,
  recurringFrequency
}) => {
  if (!isRecurring) return null;

  const hasRequiredFields = startDate && endDate && recurringFrequency;
  const hasValidDates = startDate && endDate && new Date(endDate) > new Date(startDate);

  return (
    <div className="space-y-2">
      {!hasRequiredFields && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All recurring task fields (frequency, start date, end date) are required
          </AlertDescription>
        </Alert>
      )}
      
      {hasRequiredFields && !hasValidDates && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            End date must be after start date
          </AlertDescription>
        </Alert>
      )}
      
      {hasRequiredFields && hasValidDates && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Recurring task configuration is valid. Backend automation will handle instance generation.
          </AlertDescription>
        </Alert>
      )}
      
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Backend Automation:</strong> New recurring task instances will be automatically 
          created when the previous instance is marked as completed.
        </AlertDescription>
      </Alert>
    </div>
  );
};
