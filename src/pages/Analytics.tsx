
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Quality metrics and performance analytics</p>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary grid w-full grid-cols-3 p-1 rounded-sm">
          <TabsTrigger value="overview" className="rounded-sm data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-sm data-[state=active]:bg-background">Reports</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-sm data-[state=active]:bg-background">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border">
              <CardHeader className="excel-header">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary">98.3%</div>
                <p className="text-xs text-muted-foreground mt-1">+2.1% from previous month</p>
                <div className="h-[120px] flex items-center justify-center">
                  {/* Chart placeholder */}
                  <div className="w-full h-full bg-accent/50 flex items-center justify-center">
                    Chart Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader className="excel-header">
                <CardTitle className="text-sm font-medium">Non-Conformances</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">-4 from previous month</p>
                <div className="h-[120px] flex items-center justify-center">
                  {/* Chart placeholder */}
                  <div className="w-full h-full bg-accent/50 flex items-center justify-center">
                    Chart Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader className="excel-header">
                <CardTitle className="text-sm font-medium">On-time Delivery</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary">94.7%</div>
                <p className="text-xs text-muted-foreground mt-1">+1.3% from previous month</p>
                <div className="h-[120px] flex items-center justify-center">
                  {/* Chart placeholder */}
                  <div className="w-full h-full bg-accent/50 flex items-center justify-center">
                    Chart Placeholder
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-border mt-6">
            <CardHeader className="excel-header">
              <CardTitle>Quality Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] flex items-center justify-center">
                {/* Large chart placeholder */}
                <div className="w-full h-full bg-accent/50 flex items-center justify-center">
                  Large Chart Placeholder
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Reports functionality coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Insights</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Insights functionality coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
