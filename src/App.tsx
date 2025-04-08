
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import NonConformances from "./pages/NonConformances";
import Audits from "./pages/Audits";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Organization from "./pages/Organization";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import EmailTest from "./pages/EmailTest";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

// Mock authentication - in a real app, this would be handled by an auth provider
const isAuthenticated = () => {
  // For demo purposes, always return true - in a real app, check if user is logged in
  return true;
};

// Mock admin check - in a real app, this would check if the user has admin role
const isAdmin = () => {
  // For demo purposes, always return true - in a real app, check if user has admin role
  return true;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() && isAdmin() ? <>{children}</> : <Navigate to="/" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Index />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/email-test" element={
            <ProtectedRoute>
              <MainLayout>
                <EmailTest />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/tasks" element={
            <ProtectedRoute>
              <MainLayout>
                <Tasks />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <MainLayout>
                <Documents />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/non-conformances" element={
            <ProtectedRoute>
              <MainLayout>
                <NonConformances />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/audits" element={
            <ProtectedRoute>
              <MainLayout>
                <Audits />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <MainLayout>
                <Users />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/organization" element={
            <ProtectedRoute>
              <MainLayout>
                <Organization />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/help" element={
            <ProtectedRoute>
              <MainLayout>
                <Help />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <AdminRoute>
              <MainLayout>
                <Admin />
              </MainLayout>
            </AdminRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
