
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";

const Users = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage users, roles and permissions</p>
      </div>
      
      <Card className="border-border">
        <CardHeader className="excel-header flex flex-row items-center justify-between py-2">
          <CardTitle className="text-lg">Users</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-8 h-9 w-[200px] rounded-sm" 
              />
            </div>
            <Button size="sm" variant="outline" className="excel-button">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="excel-header border-b border-border text-left">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Department</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin", department: "Quality", status: "Active" },
                  { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "Manager", department: "Production", status: "Active" },
                  { id: 3, name: "Robert Johnson", email: "robert.johnson@example.com", role: "User", department: "Engineering", status: "Inactive" },
                ].map((user) => (
                  <tr key={user.id} className="excel-row border-b border-border">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">{user.department}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" className="excel-button h-8 text-xs">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
