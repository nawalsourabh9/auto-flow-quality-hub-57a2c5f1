
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecurringTaskSectionProps {
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  recurringFrequency: string;
  setRecurringFrequency: (value: string) => void;
}

export const RecurringTaskSection: React.FC<RecurringTaskSectionProps> = ({
  isRecurring,
  setIsRecurring,
  recurringFrequency,
  setRecurringFrequency,
}) => {
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
      )}
    </div>
  );
};
