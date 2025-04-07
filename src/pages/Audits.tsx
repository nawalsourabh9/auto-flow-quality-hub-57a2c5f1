
import { Card } from "@/components/ui/card";

const Audits = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Management</h1>
        <p className="text-muted-foreground">Plan, execute and track internal and external audits</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Audit management functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default Audits;
