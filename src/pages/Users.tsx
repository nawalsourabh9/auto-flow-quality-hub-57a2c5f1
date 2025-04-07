
import { Card } from "@/components/ui/card";

const Users = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles and permissions</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">User management functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default Users;
