
import { useState, useMemo } from "react";
import { Task } from "@/types/task";
import { isSameDay } from "date-fns";

export const useTaskFilters = (tasks: Task[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [dueDateFilter, setDueDateFilter] = useState<Date | null>(null);
  const [frequencyFilter, setFrequencyFilter] = useState<string | null>(null);

  // Extract unique departments from tasks
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    tasks.forEach(task => {
      if (task.department) {
        deptSet.add(task.department);
      }
    });
    return Array.from(deptSet);
  }, [tasks]);

  // Extract unique team members from tasks
  const teamMembers = useMemo(() => {
    const membersMap = new Map();
    tasks.forEach(task => {
      if (task.assigneeDetails && task.assignee) {
        membersMap.set(task.assignee, {
          id: task.assignee,
          name: task.assigneeDetails.name,
          position: task.assigneeDetails.position || "",
          initials: task.assigneeDetails.initials,
          department: task.assigneeDetails.department || ""
        });
      }
    });
    return Array.from(membersMap.values());
  }, [tasks]);

  // Create a map of parent tasks for quick lookup
  const parentTasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach(task => {
      if (!task.parentTaskId) { // This is a parent task
        map.set(task.id, task);
      }
    });
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search term filter
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      // Status filter
      const matchesStatus = !statusFilter || task.status === statusFilter;
      
      // Priority filter
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      
      // Department filter
      const matchesDepartment = !departmentFilter || task.department === departmentFilter;
      
      // Assignee filter
      const matchesAssignee = !assigneeFilter || 
        (assigneeFilter === "unassigned" ? !task.assignee : task.assignee === assigneeFilter);
      
      // Due date filter
      const matchesDueDate = !dueDateFilter || 
        (task.dueDate && isSameDay(new Date(task.dueDate), dueDateFilter));
      
      // Enhanced Frequency filter - check both task's frequency and parent's frequency
      let matchesFrequency = true;
      if (frequencyFilter) {
        if (frequencyFilter === "non-recurring") {
          // Show only non-recurring tasks (no parent and not recurring)
          matchesFrequency = !task.isRecurring && !task.parentTaskId;
        } else {
          // For specific frequencies, check:
          // 1. If it's a parent recurring task with matching frequency
          // 2. If it's an instance whose parent has matching frequency
          const taskFrequency = task.recurringFrequency;
          const parentTask = task.parentTaskId ? parentTasksMap.get(task.parentTaskId) : null;
          const parentFrequency = parentTask?.recurringFrequency;
          
          matchesFrequency = taskFrequency === frequencyFilter || parentFrequency === frequencyFilter;
        }
      }
      
      return matchesSearch && 
             matchesStatus && 
             matchesPriority && 
             matchesDepartment && 
             matchesAssignee && 
             matchesDueDate &&
             matchesFrequency;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, departmentFilter, assigneeFilter, dueDateFilter, frequencyFilter, parentTasksMap]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    departmentFilter,
    setDepartmentFilter,
    assigneeFilter,
    setAssigneeFilter,
    dueDateFilter,
    setDueDateFilter,
    frequencyFilter,
    setFrequencyFilter,
    filteredTasks,
    departments,
    teamMembers
  };
};
