
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskApprovalSettings } from "@/components/admin/TaskApprovalSettings";
import { HROneIntegration } from "@/components/admin/HROneIntegration";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("task-approval");

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
          <TabsTrigger value="task-approval">Task Approval</TabsTrigger>
          <TabsTrigger value="hrone-integration">HROne Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="task-approval" className="space-y-4">
          <TaskApprovalSettings />
        </TabsContent>
        
        <TabsContent value="hrone-integration" className="space-y-4">
          <HROneIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
