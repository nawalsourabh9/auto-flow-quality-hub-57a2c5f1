
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const NonConformance = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Non-Conformance</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage non-conformance reports
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Non-Conformance Reports</CardTitle>
          <CardDescription>
            No non-conformance reports found. Create your first report to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No reports to display</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NonConformance;
