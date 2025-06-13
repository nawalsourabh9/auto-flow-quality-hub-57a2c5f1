
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Documents from "@/pages/Documents";
import Audits from "@/pages/Audits";
import NonConformance from "@/pages/NonConformance";
import TeamMembers from "@/pages/TeamMembers";
import Settings from "@/pages/Settings";
import TaskAutomationTest from "@/pages/TaskAutomationTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="documents" element={<Documents />} />
              <Route path="audits" element={<Audits />} />
              <Route path="non-conformance" element={<NonConformance />} />
              <Route path="team" element={<TeamMembers />} />
              <Route path="settings" element={<Settings />} />
              <Route path="automation-test" element={<TaskAutomationTest />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
