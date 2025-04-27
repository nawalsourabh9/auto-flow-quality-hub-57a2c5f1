
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserSearch } from "./UserSearch";

interface UsersHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddEmployee: () => void;
}

export function UsersHeader({ searchTerm, setSearchTerm, onAddEmployee }: UsersHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-border">
      <div className="flex items-center space-x-2 w-full max-w-sm">
        <Input
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>
      <Button onClick={onAddEmployee} size="sm">
        <UserPlus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>
    </div>
  );
}
