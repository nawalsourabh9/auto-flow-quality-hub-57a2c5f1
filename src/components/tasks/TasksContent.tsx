
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TaskTable from "./TaskTable";
import { Task, TeamMember } from "@/types/task";

interface TasksContentProps {
  filteredTasks: Task[];
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  isAdmin: boolean;
  currentUserId: string | undefined;
  currentUserPermissions: any;
  teamMembers: TeamMember[];
}

const TasksContent: React.FC<TasksContentProps> = ({
  filteredTasks,
  onViewTask,
  onEditTask,
  onDeleteTask,
  isAdmin,
  currentUserId,
  currentUserPermissions,
  teamMembers
}) => {
  // Group tasks to show parent tasks and their instances together
  const groupedTasks = React.useMemo(() => {
    const parentTasks = filteredTasks.filter(task => !task.parentTaskId);
    const childTasks = filteredTasks.filter(task => task.parentTaskId);
    
    // Create a map of parent tasks with their children
    const taskGroups = parentTasks.map(parentTask => {
      const children = childTasks.filter(child => child.parentTaskId === parentTask.id);
      return {
        parent: parentTask,
        children: children.sort((a, b) => 
          (b.recurrenceCountInPeriod || 0) - (a.recurrenceCountInPeriod || 0)
        )
      };
    });
    
    // Add orphaned child tasks (those whose parents aren't in the filtered list)
    const orphanedChildren = childTasks.filter(child => 
      !parentTasks.some(parent => parent.id === child.parentTaskId)
    );
    
    return { taskGroups, orphanedChildren };
  }, [filteredTasks]);

  const allDisplayTasks = React.useMemo(() => {
    const result: Task[] = [];
    
    // Add all task groups (parent + children)
    groupedTasks.taskGroups.forEach(group => {
      result.push(group.parent);
      result.push(...group.children);
    });
    
    // Add orphaned children
    result.push(...groupedTasks.orphanedChildren);
    
    return result;
  }, [groupedTasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tasks ({filteredTasks.length})</span>
          <div className="text-sm text-muted-foreground">
            {groupedTasks.taskGroups.filter(g => g.parent.isRecurring).length} recurring series
          </div>
        </CardTitle>
        
        {/* Legend for recurring task naming and colors */}
        <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
          <div className="text-sm font-medium text-muted-foreground">
            Recurring Task Legend:
          </div>
          
          {/* Frequency Colors */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <div className="w-3 h-3 bg-emerald-500 rounded mr-2"></div>
              Daily (D)
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              Weekly (W)
            </Badge>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              <div className="w-3 h-3 bg-indigo-500 rounded mr-2"></div>
              Bi-weekly (BW)
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
              Monthly (M)
            </Badge>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              <div className="w-3 h-3 bg-rose-500 rounded mr-2"></div>
              Quarterly (Q)
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              Annually (A)
            </Badge>
          </div>

          {/* Naming Convention */}
          <div className="border-t pt-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Naming:</strong> D1-Jan, D2-Jan → Instance numbers within the period (1st Daily in January, 2nd Daily in January)</div>
              <div><strong>Due Date Setup:</strong> When creating a recurring task, the due date you provide becomes the first instance's due date</div>
              <div><strong>Start Date:</strong> When the recurring template becomes active (defaults to due date if not provided)</div>
              <div><strong>End Date:</strong> When to stop generating new instances (optional - leave blank for indefinite)</div>
              <div><strong>First Instance Due Date:</strong> The first generated instance will use the start date as its due date - you may need to manually update it to match your intended schedule</div>
              <div><strong>Templates:</strong> Master definitions with colored rows based on frequency - have no due dates, used to generate instances</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TaskTable
          tasks={allDisplayTasks}
          onViewTask={onViewTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          currentUserPermissions={currentUserPermissions}
          teamMembers={teamMembers}
        />
      </CardContent>
    </Card>
  );
};

export default TasksContent;
