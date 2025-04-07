
import { Card } from "@/components/ui/card";

const Tasks = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks Management</h1>
        <p className="text-muted-foreground">Assign, track and manage tasks across your organization</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Task management functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default Tasks;
