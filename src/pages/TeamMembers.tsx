
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const TeamMembers = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team members and their roles
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Team Overview
          </CardTitle>
          <CardDescription>
            View and manage all team members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Invite team members to start collaborating
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMembers;
