
import React from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";

interface PendingTasksAlertProps {
  pendingTasks: Task[];
  activeTab: string;
  onViewPendingTasks: () => void;
}

const PendingTasksAlert = ({ pendingTasks, activeTab, onViewPendingTasks }: PendingTasksAlertProps) => {
  if (pendingTasks.length === 0 || activeTab === "pending-approval") return null;

  return (
    <Card className="bg-amber-50 border-amber-200">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-amber-600 h-5 w-5" />
          <div>
            <p className="font-medium text-amber-800">Tasks Pending Your Approval</p>
            <p className="text-sm text-amber-700">
              {pendingTasks.length} {pendingTasks.length === 1 ? "task needs" : "tasks need"} your approval
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
          onClick={onViewPendingTasks}
        >
          View Tasks
        </Button>
      </div>
    </Card>
  );
};

export default PendingTasksAlert;
