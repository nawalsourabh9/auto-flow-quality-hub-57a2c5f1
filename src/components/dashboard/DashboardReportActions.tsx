
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Clock } from "lucide-react";

export function DashboardReportActions() {
  const [loading, setLoading] = useState(false);

  const sendDashboardReport = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("send-dashboard-report", {
        body: {
          sendToAll: true
        }
      });

      if (error) {
        throw error;
      }

      toast.success(
        "Dashboard reports sent successfully", 
        { description: `Reports sent to ${data.results?.length || 0} recipients` }
      );
    } catch (error) {
      console.error("Error sending dashboard report:", error);
      toast.error(
        "Failed to send dashboard reports", 
        { description: error.message || "An unexpected error occurred" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Reports</CardTitle>
        <CardDescription>
          Send dashboard reports to management team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Scheduled Report</p>
                <p className="text-xs text-muted-foreground">Daily at 21:00</p>
              </div>
            </div>
            <Button
              onClick={sendDashboardReport}
              disabled={loading}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Now"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
