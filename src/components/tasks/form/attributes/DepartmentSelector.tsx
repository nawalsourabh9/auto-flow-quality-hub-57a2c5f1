
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DepartmentSelectorProps {
  department: string;
  setDepartment: (value: string) => void;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  department,
  setDepartment,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="department">Department</Label>
      <Select value={department} onValueChange={setDepartment}>
        <SelectTrigger>
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Quality">Quality</SelectItem>
          <SelectItem value="Engineering">Engineering</SelectItem>
          <SelectItem value="Production">Production</SelectItem>
          <SelectItem value="HR">Human Resources</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="IT">Information Technology</SelectItem>
          <SelectItem value="Executive">Executive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
