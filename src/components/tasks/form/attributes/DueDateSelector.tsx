
import React from "react";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface DueDateSelectorProps {
  dueDate: string;
  setDueDate: (value: string) => void;
}

export const DueDateSelector: React.FC<DueDateSelectorProps> = ({
  dueDate,
  setDueDate,
}) => {
  // Convert string date to Date object for the calendar
  // Safely parse the date and ensure it's valid
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
  
  const dateValue = parseDateSafely(dueDate);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log("Selected date:", formattedDate);
      setDueDate(formattedDate);
    } else {
      setDueDate("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="dueDate">Due Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dueDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
