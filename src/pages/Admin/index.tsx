
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskApprovalSettings } from "@/components/admin/TaskApprovalSettings";
import { HROneIntegration } from "@/components/admin/HROneIntegration";
import UserApprovals from "./UserApprovals";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("user-approvals");
  
  // Add mock data for TaskApprovalSettings with correct types
  const mockDepartments = [
    { id: "1", name: "Quality" },
    { id: "2", name: "Production" },
    { id: "3", name: "HR" }
  ];
  
  const mockUsers = [
    { 
      id: "1", 
      name: "John Doe",
      initials: "JD",
      position: "Quality Manager",
      department: "Quality"
    },
    { 
      id: "2", 
      name: "Jane Smith",
      initials: "JS",
      position: "Production Lead",
      department: "Production"
    }
  ];
  
  const handleUpdateSettings = (settings: any) => {
    console.log("Settings updated:", settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and integrations
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="user-approvals">User Approvals</TabsTrigger>
          <TabsTrigger value="task-approval">Task Approval</TabsTrigger>
          <TabsTrigger value="hrone-integration">HROne Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user-approvals" className="space-y-4">
          <UserApprovals />
        </TabsContent>
        
        <TabsContent value="task-approval" className="space-y-4">
          <TaskApprovalSettings 
            departments={mockDepartments}
            users={mockUsers}
            onUpdateSettings={handleUpdateSettings}
          />
        </TabsContent>
        
        <TabsContent value="hrone-integration" className="space-y-4">
          <HROneIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
