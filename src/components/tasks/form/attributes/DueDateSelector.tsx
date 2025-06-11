
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseInputDate, formatDateForInput, formatDateForDisplay } from "@/utils/dateUtils";

interface DueDateSelectorProps {
  dueDate: string;
  setDueDate: (value: string) => void;
}

export const DueDateSelector: React.FC<DueDateSelectorProps> = ({
  dueDate,
  setDueDate,
}) => {
  // Convert string date to Date object for the calendar
  const dateValue = parseInputDate(dueDate);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForInput(date);
      console.log("DueDateSelector: Selected date:", formattedDate);
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
            {dateValue ? formatDateForDisplay(dateValue) : <span>Pick a date</span>}
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
