
import { Card } from "@/components/ui/card";

const Documents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents Control</h1>
        <p className="text-muted-foreground">Manage all your quality documents in compliance with IATF standards</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Document control functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default Documents;
