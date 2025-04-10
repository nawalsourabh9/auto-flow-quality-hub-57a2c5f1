
import { InviteUserForm } from "@/components/invite/InviteUserForm";
import { useAuth } from "@/hooks/use-auth";

const InviteUser = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <InviteUserForm />
    </div>
  );
};

export default InviteUser;
