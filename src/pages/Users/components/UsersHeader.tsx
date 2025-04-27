
import { CardHeader, CardTitle } from "@/components/ui/card";
import { UserSearch } from "./UserSearch";

interface UsersHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const UsersHeader = ({ searchTerm, setSearchTerm }: UsersHeaderProps) => {
  return (
    <CardHeader className="excel-header flex flex-row items-center justify-between py-2">
      <CardTitle className="text-lg">Employees</CardTitle>
      <div className="flex items-center gap-2">
        <UserSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
    </CardHeader>
  );
};
