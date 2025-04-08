
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface TaskApprovalSettingsProps {
  departments: Array<{
    id: string;
    name: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    initials: string;
    position: string;
    department?: string;
  }>;
  onUpdateSettings: (departmentId: string, settings: any) => void;
}

const formSchema = z.object({
  departmentHeadId: z.string().nonempty("Department head is required"),
  requiresApproval: z.boolean().default(true),
  canReassign: z.boolean().default(false),
  autoNotify: z.boolean().default(true),
});

export const TaskApprovalSettings: React.FC<TaskApprovalSettingsProps> = ({
  departments,
  users,
  onUpdateSettings
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  // Mock departmental settings - in a real app, this would come from API
  const [departmentSettings, setDepartmentSettings] = useState<Record<string, {
    departmentHeadId: string;
    requiresApproval: boolean;
    canReassign: boolean;
    autoNotify: boolean;
  }>>({
    "1": { // Manufacturing
      departmentHeadId: "user-1",
      requiresApproval: true,
      canReassign: false,
      autoNotify: true
    },
    "2": { // Quality
      departmentHeadId: "user-2",
      requiresApproval: true,
      canReassign: true,
      autoNotify: true
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentHeadId: "",
      requiresApproval: true,
      canReassign: false,
      autoNotify: true
    },
  });

  const handleEditSettings = (department: typeof departments[0]) => {
    setSelectedDepartment(department);
    
    const settings = departmentSettings[department.id] || {
      departmentHeadId: "",
      requiresApproval: true,
      canReassign: false,
      autoNotify: true
    };
    
    form.reset(settings);
    setIsDialogOpen(true);
  };

  const handleSave = (values: z.infer<typeof formSchema>) => {
    if (!selectedDepartment) return;
    
    const updatedSettings = {
      departmentHeadId: values.departmentHeadId,
      requiresApproval: values.requiresApproval,
      canReassign: values.canReassign,
      autoNotify: values.autoNotify
    };
    
    setDepartmentSettings(prev => ({
      ...prev,
      [selectedDepartment.id]: updatedSettings
    }));
    
    onUpdateSettings(selectedDepartment.id, updatedSettings);
    setIsDialogOpen(false);
  };

  const getDepartmentHeadName = (departmentHeadId: string) => {
    const user = users.find(u => u.id === departmentHeadId);
    return user ? user.name : "Not Assigned";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Department Task Approval Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Department Head (Approver)</TableHead>
                <TableHead>Requires Approval</TableHead>
                <TableHead>Can Reassign Tasks</TableHead>
                <TableHead>Auto Notify</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map(department => {
                const settings = departmentSettings[department.id];
                
                return (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      {settings ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {users.find(u => u.id === settings.departmentHeadId)?.initials || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{getDepartmentHeadName(settings.departmentHeadId)}</span>
                        </div>
                      ) : (
                        "Not configured"
                      )}
                    </TableCell>
                    <TableCell>
                      {settings ? (
                        settings.requiresApproval ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {settings ? (
                        settings.canReassign ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      {settings ? (
                        settings.autoNotify ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditSettings(department)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              Configure Task Approval for {selectedDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="departmentHeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Head (Approver)</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a department head" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requiresApproval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Requires Approval</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Tasks must be approved by the department head before being assigned
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="canReassign"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Can Reassign Tasks</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Department head can reassign tasks to other team members
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="autoNotify"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto Notify</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically send notifications for task assignments and approvals
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
