
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, MessageSquare } from "lucide-react";

export default function Help() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions or contact support</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Search Knowledge Base</CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search"
                  placeholder="Search for help articles..."
                  className="pl-8 rounded-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-4 flex flex-col space-y-1 items-center justify-center rounded-sm">
                  <span className="text-sm font-semibold">Tasks</span>
                  <span className="text-xs text-muted-foreground">How to manage tasks</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col space-y-1 items-center justify-center rounded-sm">
                  <span className="text-sm font-semibold">Documents</span>
                  <span className="text-xs text-muted-foreground">Managing documents</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col space-y-1 items-center justify-center rounded-sm">
                  <span className="text-sm font-semibold">Audits</span>
                  <span className="text-xs text-muted-foreground">Audit process</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col space-y-1 items-center justify-center rounded-sm">
                  <span className="text-sm font-semibold">Analytics</span>
                  <span className="text-xs text-muted-foreground">View reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-border rounded-sm">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@bdsmanufacturing.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border rounded-sm">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">+1 (800) 555-1234</p>
                  <p className="text-xs text-muted-foreground">Mon-Fri, 8am-6pm ET</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border rounded-sm">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available during business hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="border-border">
            <CardHeader className="excel-header">
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions and answers about the E-QMS system</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="item-1" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How do I reset my password?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    To reset your password, click on the "Forgot password?" link on the login page. You will receive an email with instructions to reset your password. Follow the link in the email to create a new password.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How do I create a new document?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    To create a new document, navigate to the Documents section and click on the "New Document" button. Fill in the required fields in the document creation form and click "Save" to create the document.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How do I schedule an audit?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    To schedule an audit, go to the Audits section and click on "Schedule Audit". Select the audit type, assigned auditors, departments to be audited, and set the date. Add any specific requirements or notes and click "Schedule" to create the audit.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How do I report a non-conformance?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    To report a non-conformance, navigate to the Non-Conformances section and click "Report New". Fill in the details including description, severity, and related processes. Attach any relevant documentation and submit the report for review.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How are tasks assigned in the system?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Tasks can be assigned manually by managers or automatically generated based on system events like upcoming audits or document reviews. You can assign tasks to team members by selecting their name in the task assignment field.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6" className="border-border rounded-sm px-4">
                  <AccordionTrigger className="font-medium hover:no-underline">How do I generate quality reports?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Quality reports can be generated from the Analytics section. Select the type of report you wish to generate, set the time period and other parameters, then click "Generate Report". You can export reports in various formats including PDF, Excel, and CSV.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
