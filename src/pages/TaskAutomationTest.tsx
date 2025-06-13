
import React from "react";
import TaskAutomationDebug from "@/components/tasks/TaskAutomationDebug";

const TaskAutomationTest = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task Automation Testing</h1>
        <p className="text-muted-foreground mt-2">
          Test and debug the automatic recurring task generation system
        </p>
      </div>
      
      <TaskAutomationDebug />
    </div>
  );
};

export default TaskAutomationTest;
