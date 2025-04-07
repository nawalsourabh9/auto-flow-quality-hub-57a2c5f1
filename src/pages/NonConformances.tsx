
import { Card } from "@/components/ui/card";

const NonConformances = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Non-Conformance</h1>
        <p className="text-muted-foreground">Track and manage non-conformances and corrective actions</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Non-conformance management functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default NonConformances;
