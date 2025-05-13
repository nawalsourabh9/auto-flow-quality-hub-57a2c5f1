
import { useState, useMemo } from "react";
import { Task } from "@/types/task";

export const useTaskFilters = (tasks: Task[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.approvalStatus === 'pending');
  }, [tasks]);

  const filteredPendingTasks = useMemo(() => {
    return pendingTasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  }, [pendingTasks, searchTerm, priorityFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    filteredTasks,
    pendingTasks,
    filteredPendingTasks
  };
};
