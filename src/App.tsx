
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { MainLayout } from "@/components/layout/MainLayout";
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
            <Route path="/" element={<MainLayout><Navigate to="/dashboard" replace /></MainLayout>} />
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/tasks" element={<MainLayout><Tasks /></MainLayout>} />
            <Route path="/documents" element={<MainLayout><Documents /></MainLayout>} />
            <Route path="/audits" element={<MainLayout><Audits /></MainLayout>} />
            <Route path="/non-conformance" element={<MainLayout><NonConformance /></MainLayout>} />
            <Route path="/team" element={<MainLayout><TeamMembers /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/automation-test" element={<MainLayout><TaskAutomationTest /></MainLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
