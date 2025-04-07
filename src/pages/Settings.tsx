
import { Card } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your E-QMS application settings</p>
      </div>
      
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Settings functionality coming soon.</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
