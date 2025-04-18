
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const UserSearch = ({ searchTerm, setSearchTerm }: UserSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        placeholder="Search employees..." 
        className="pl-8 h-9 w-[200px] rounded-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};
