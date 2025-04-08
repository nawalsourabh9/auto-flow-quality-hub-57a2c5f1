import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertTriangle } from "lucide-react";

const Admin = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and permissions</p>
      </div>
      
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Administrator Access Only</AlertTitle>
        <AlertDescription>
          These settings affect the entire system and should only be modified by authorized administrators.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="bg-secondary grid w-full grid-cols-4 p-1 rounded-sm">
          <TabsTrigger value="permissions" className="rounded-sm data-[state=active]:bg-background">Permissions</TabsTrigger>
          <TabsTrigger value="workflow" className="rounded-sm data-[state=active]:bg-background">Workflow</TabsTrigger>
          <TabsTrigger value="document-types" className="rounded-sm data-[state=active]:bg-background">Document Types</TabsTrigger>
          <TabsTrigger value="task-approvals" className="rounded-sm data-[state=active]:bg-background">Task Approvals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Permission Settings</CardTitle>
              <CardDescription>Configure user permissions for the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>View Documents</TableHead>
                    <TableHead>Edit Documents</TableHead>
                    <TableHead>Approve Documents</TableHead>
                    <TableHead>Admin Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Administrator</TableCell>
                    <TableCell><Switch checked={true} disabled /></TableCell>
                    <TableCell><Switch checked={true} disabled /></TableCell>
                    <TableCell><Switch checked={true} disabled /></TableCell>
                    <TableCell><Switch checked={true} disabled /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled>Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Quality Manager</TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Document Controller</TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Standard User</TableCell>
                    <TableCell><Switch checked={true} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell><Switch checked={false} /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-6">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workflow">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Workflow Configuration</CardTitle>
              <CardDescription>Configure workflow and approval processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-approval-flow">Default Approval Flow</Label>
                    <Select defaultValue="sequential">
                      <SelectTrigger id="default-approval-flow">
                        <SelectValue placeholder="Select approval flow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequential</SelectItem>
                        <SelectItem value="parallel">Parallel</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auto-escalation">Auto-Escalation (days)</Label>
                    <Input id="auto-escalation" type="number" defaultValue="3" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-auto-reminders">Enable Automatic Reminders</Label>
                    <Switch id="enable-auto-reminders" checked={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send automatic reminders for pending approvals and tasks
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-delegation">Enable Approval Delegation</Label>
                    <Switch id="enable-delegation" checked={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow users to delegate approval authority to others
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button>Save Workflow Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="document-types">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Document Types</CardTitle>
              <CardDescription>Configure document types and their approval flows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Approval Levels</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Quality Manual</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>10 years</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm">Configure</Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Configure Document Type</SheetTitle>
                            <SheetDescription>
                              Set approval flow and retention settings for this document type
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-4 space-y-4">
                            <div className="space-y-2">
                              <Label>Document Type Name</Label>
                              <Input defaultValue="Quality Manual" />
                            </div>
                            <div className="space-y-2">
                              <Label>Approval Levels</Label>
                              <Input type="number" defaultValue="3" />
                            </div>
                            <div className="space-y-2">
                              <Label>Retention Period (years)</Label>
                              <Input type="number" defaultValue="10" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Active Status</Label>
                                <Switch checked={true} />
                              </div>
                            </div>
                            <Button className="w-full mt-4">Save Changes</Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Work Instructions</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>5 years</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Procedures</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>7 years</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Forms</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>3 years</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Records</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>5 years</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Configure</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-6">
                <Button>Add Document Type</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="task-approvals">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Task Approval Settings</CardTitle>
              <CardDescription>Configure task approval hierarchy and requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="task-approval-flow">Default Task Approval Flow</Label>
                    <Select defaultValue="manager-only">
                      <SelectTrigger id="task-approval-flow">
                        <SelectValue placeholder="Select approval flow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager-only">Manager Only</SelectItem>
                        <SelectItem value="department-head">Department Head</SelectItem>
                        <SelectItem value="quality-manager">Quality Manager</SelectItem>
                        <SelectItem value="multi-level">Multi-Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="task-escalation">Task Escalation (hours)</Label>
                    <Input id="task-escalation" type="number" defaultValue="24" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-comments">Require Comments for Rejection</Label>
                    <Switch id="require-comments" checked={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Require users to provide comments when rejecting tasks
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-bulk-approval">Enable Bulk Approval</Label>
                    <Switch id="enable-bulk-approval" checked={true} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow users to approve multiple tasks at once
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button>Save Task Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
