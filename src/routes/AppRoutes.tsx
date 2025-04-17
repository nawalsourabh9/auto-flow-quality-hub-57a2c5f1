
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Import all pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ResetPassword from "@/pages/ResetPassword";
import AcceptInvite from "@/pages/AcceptInvite";
import CreateAdmin from "@/pages/CreateAdmin";
import Tasks from "@/pages/Tasks";
import Documents from "@/pages/Documents";
import NonConformances from "@/pages/NonConformances";
import Audits from "@/pages/Audits";
import Analytics from "@/pages/Analytics";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Help from "@/pages/Help";
import Organization from "@/pages/Organization";
import EmailTest from "@/pages/EmailTest";
import Admin from "@/pages/Admin/index"; // Making sure we're using the correct Admin component
import InviteUser from "@/pages/InviteUser";
import NotFound from "@/pages/NotFound";
import ChangePassword from "@/pages/ChangePassword";

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

export const AppRoutes = () => {
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
      
      <Route path="/change-password" element={
        <ProtectedRoute>
          <MainLayout>
            <ChangePassword />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {[
        { path: "/tasks", element: <Tasks /> },
        { path: "/documents", element: <Documents /> },
        { path: "/non-conformances", element: <NonConformances /> },
        { path: "/audits", element: <Audits /> },
        { path: "/analytics", element: <Analytics /> },
        { path: "/organization", element: <Organization /> },
        { path: "/users", element: <Users /> },
        { path: "/settings", element: <Settings /> },
        { path: "/profile", element: <Profile /> },
        { path: "/help", element: <Help /> },
        { path: "/email-test", element: <EmailTest /> }
      ].map(({ path, element }) => (
        <Route key={path} path={path} element={
          <ProtectedRoute>
            <MainLayout>{element}</MainLayout>
          </ProtectedRoute>
        } />
      ))}
      
      <Route path="/admin" element={
        <AdminRoute>
          <MainLayout>
            <Admin />
          </MainLayout>
        </AdminRoute>
      } />
      
      <Route path="/invite-user" element={
        <SuperAdminRoute>
          <InviteUser />
        </SuperAdminRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
