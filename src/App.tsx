import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { NotificationsProvider } from "./hooks/use-notifications";
import { AuthProvider, useAuth } from "./hooks/use-auth";
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
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import EmailTest from "./pages/EmailTest";
import Admin from "./pages/Admin";
import InviteUser from "./pages/InviteUser";
import AcceptInvite from "./pages/AcceptInvite";
import CreateAdmin from "./pages/CreateAdmin";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  const isPreviewMode = new URLSearchParams(location.search).get('preview') === 'true';

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isPreviewMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/create-admin" element={<CreateAdmin />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Index />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/invite-user" element={
        <SuperAdminRoute>
          <InviteUser />
        </SuperAdminRoute>
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
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <NotificationsProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </NotificationsProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
