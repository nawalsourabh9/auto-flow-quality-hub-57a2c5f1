
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parse, isValid, addMonths, isBefore } from "date-fns";

interface RecurringTaskSectionProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurringFrequency: string;
  setRecurringFrequency: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
}

export const RecurringTaskSection: React.FC<RecurringTaskSectionProps> = ({
  isRecurring,
  setIsRecurring,
  recurringFrequency,
  setRecurringFrequency,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  // Convert string date to Date object for the calendar
  const parseDateSafely = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    
    // Check if the date is in ISO format (yyyy-MM-ddTHH:mm:ss)
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      return isValid(date) ? date : undefined;
    }
    
    // Try to parse as yyyy-MM-dd
    try {
      const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
      return isValid(parsedDate) ? parsedDate : undefined;
    } catch (error) {
      console.error("Error parsing date:", error);
      return undefined;
    }
  };

  const startDateValue = parseDateSafely(startDate);
  const endDateValue = parseDateSafely(endDate);
  
  // Calculate maximum allowed end date (6 months from start date)
  const maxEndDate = startDateValue ? addMonths(startDateValue, 6) : undefined;
  
  // Check if end date is valid (within 6 months from start date)
  const isEndDateValid = !endDateValue || !startDateValue || 
    (isBefore(endDateValue, addMonths(startDateValue, 6)) && 
     isBefore(startDateValue, endDateValue));

  // When start date changes, adjust end date if needed
  useEffect(() => {
    if (startDateValue && endDateValue) {
      // If end date is more than 6 months after start date, reset it
      if (!isBefore(endDateValue, addMonths(startDateValue, 6))) {
        setEndDate("");
      }
      // If end date is before start date, reset it
      else if (isBefore(endDateValue, startDateValue)) {
        setEndDate("");
      }
    }
  }, [startDate, endDateValue, startDateValue, setEndDate]);

  // Handle date selection from calendar
  const handleDateSelect = (setter: (value: string) => void) => (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setter(formattedDate);
    } else {
      setter("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="isRecurring" className="text-sm font-medium">
          Recurring Task
        </Label>
        <Switch
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
      </div>

      {isRecurring && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recurringFrequency" className="text-sm font-medium">
              Frequency
            </Label>
            <Select
              value={recurringFrequency}
              onValueChange={setRecurringFrequency}
            >
              <SelectTrigger id="recurringFrequency" className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="startDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDateValue ? format(startDateValue, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDateValue}
                  onSelect={handleDateSelect(setStartDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              {startDateValue && (
                <span className="text-xs text-muted-foreground">
                  Max: {maxEndDate ? format(maxEndDate, "MMM dd, yyyy") : ""}
                </span>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                    !isEndDateValid && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDateValue ? format(endDateValue, "PPP") : <span>Pick an end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDateValue}
                  onSelect={handleDateSelect(setEndDate)}
                  disabled={(date) => {
                    // Disable dates before start date or more than 6 months after start date
                    if (!startDateValue) return false;
                    return date < startDateValue || date > addMonths(startDateValue, 6);
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {!isEndDateValid && endDateValue && (
              <div className="flex items-center text-destructive text-xs mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                End date must be after start date and within 6 months
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
