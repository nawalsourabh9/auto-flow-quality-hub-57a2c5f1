
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your E-QMS application settings</p>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-secondary grid w-full grid-cols-4 p-1 rounded-sm">
          <TabsTrigger value="general" className="rounded-sm data-[state=active]:bg-background">General</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-sm data-[state=active]:bg-background">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-sm data-[state=active]:bg-background">Notifications</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-sm data-[state=active]:bg-background">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="Auto Components Manufacturing" className="rounded-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-location">Site Location</Label>
                  <Input id="site-location" defaultValue="Main Plant" className="rounded-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Administrator Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@example.com" className="rounded-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select id="language" className="w-full p-2 rounded-sm border border-border bg-background">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" className="rounded-sm border-border">Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90 rounded-sm">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Appearance settings coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Notification settings coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advanced">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced system settings</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Advanced settings coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
