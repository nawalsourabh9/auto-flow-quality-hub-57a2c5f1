
import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttachmentsSelectorProps {
  attachmentsRequired: "none" | "optional" | "required";
  setAttachmentsRequired: (value: "none" | "optional" | "required") => void;
}

export const AttachmentsSelector: React.FC<AttachmentsSelectorProps> = ({
  attachmentsRequired,
  setAttachmentsRequired,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="attachmentsRequired">Attachments</Label>
      <Select value={attachmentsRequired} onValueChange={setAttachmentsRequired}>
        <SelectTrigger>
          <SelectValue placeholder="Select attachment requirement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="optional">Optional</SelectItem>
          <SelectItem value="required">Required</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
