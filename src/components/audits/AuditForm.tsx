
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Audit } from "@/types/task";

interface AuditFormProps {
  onSubmit: (audit: Audit) => void;
  initialData: Partial<Audit>;
}

const AuditForm: React.FC<AuditFormProps> = ({ onSubmit, initialData }) => {
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [auditType, setAuditType] = useState(initialData.auditType || "");
  const [department, setDepartment] = useState(initialData.department || "");
  const [auditor, setAuditor] = useState(initialData.auditor || "");
  const [status, setStatus] = useState(initialData.status || "scheduled");
  const [date, setDate] = useState<Date | undefined>(
    initialData.scheduledDate ? new Date(initialData.scheduledDate) : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduledDate = date ? format(date, "yyyy-MM-dd") : "";
    
    const auditData: Audit = {
      id: initialData.id || String(Date.now()),
      title,
      description: description || "",
      auditType: auditType as "internal" | "external" | "supplier" | "customer" | "regulatory",
      department,
      auditor,
      scheduledDate,
      status: status as "scheduled" | "in-progress" | "completed" | "postponed" | "cancelled",
      createdAt: initialData.createdAt || new Date().toISOString(),
      ...(initialData.completedAt && { completedAt: initialData.completedAt })
    };
    
    onSubmit(auditData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Audit Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter audit title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter audit description"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="auditType">Audit Type</Label>
          <Select value={auditType} onValueChange={setAuditType}>
            <SelectTrigger id="auditType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Quality">Quality</SelectItem>
              <SelectItem value="Production">Production</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Procurement">Procurement</SelectItem>
              <SelectItem value="EHS">EHS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="auditor">Auditor</Label>
          <Input
            id="auditor"
            value={auditor}
            onChange={(e) => setAuditor(e.target.value)}
            placeholder="Enter auditor name or ID"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="postponed">Postponed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="scheduledDate">Scheduled Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="scheduledDate"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={!title || !auditType || !department || !date}>
          {initialData.id ? "Update Audit" : "Create Audit"}
        </Button>
      </div>
    </form>
  );
};

export default AuditForm;
