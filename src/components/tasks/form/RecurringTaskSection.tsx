
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

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
            <Label htmlFor="endDate" className="text-sm font-medium">
              End Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="endDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
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
                  disabled={(date) => startDate && date < new Date(startDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};
