
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";

interface TaskApprovalSectionProps {
  tasks: Task[];
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
}

const TaskApprovalSection = ({ tasks, onApproveTask, onRejectTask }: TaskApprovalSectionProps) => {
  if (tasks.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No tasks pending approval</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-0">
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Task</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {task.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{task.department}</td>
                  <td className="px-4 py-3 text-sm">{task.dueDate}</td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      task.priority === "high" ? "destructive" :
                      task.priority === "medium" ? "default" : "secondary"
                    }>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{task.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApproveTask(task)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onRejectTask(task)}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default TaskApprovalSection;
