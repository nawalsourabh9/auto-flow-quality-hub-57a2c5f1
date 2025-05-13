
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TaskBasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}

export const TaskBasicInfo: React.FC<TaskBasicInfoProps> = ({
  title,
  setTitle,
  description,
  setDescription
}) => {
  return (
    <>
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Task Title <span className="text-destructive">*</span>
        </label>
        <Input 
          id="title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          placeholder="Enter task title" 
          className="border border-input rounded-md" 
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description <span className="text-destructive">*</span>
        </label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          required 
          placeholder="Enter task description" 
          rows={2} 
          className="border border-input rounded-md" 
        />
      </div>
    </>
  );
};
