
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTaskAutomation } from "@/hooks/use-task-automation";
import { Clock, Play } from "lucide-react";

const TaskAutomationDebug: React.FC = () => {
  const { triggerAutomation, isRunning } = useTaskAutomation();

  // Only show in development or for testing
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  return (
    <Card className="mb-4 border-dashed border-2 border-amber-300 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Task Automation Debug (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={triggerAutomation}
            disabled={isRunning}
            className="border-amber-300 hover:bg-amber-100"
          >
            <Play className="h-3 w-3 mr-1" />
            {isRunning ? "Running..." : "Trigger Automation"}
          </Button>
          <p className="text-xs text-amber-700">
            Manually trigger overdue status updates and recurring task creation
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskAutomationDebug;
