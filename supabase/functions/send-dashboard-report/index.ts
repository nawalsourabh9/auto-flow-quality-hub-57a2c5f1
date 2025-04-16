
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { Canvas, FontStyle } from "https://deno.land/x/pdfkit@v1.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType?: string;
  sendToAll?: boolean;
  recipients?: string[];
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  department: string;
  position: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  position: string;
  department_id: string | null;
}

// Function to fetch managers, supervisors and bosses from the database
async function getManagementTeam() {
  try {
    // This is a simplified example - in a real implementation, 
    // you would query the database to get the actual management team
    // For now we'll return some sample data
    return [
      { id: 1, name: "John Doe", email: "john.doe@example.com", role: "Admin", department: "Quality", position: "Quality Manager" },
      { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "Manager", department: "Production", position: "Production Lead" }
    ];
  } catch (error) {
    console.error("Error fetching management team:", error);
    throw error;
  }
}

// Function to generate a PDF report based on dashboard data
async function generateDashboardReportPDF(recipient: string): Promise<Uint8Array> {
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create a new PDF document
  const pdfDoc = new Canvas({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: [612, 792] // US Letter size
  });

  // Add metadata
  pdfDoc.info.title = "E-QMS Daily Dashboard Report";
  pdfDoc.info.author = "E-QMS System";
  pdfDoc.info.subject = `Report generated on ${reportDate}`;

  // Add header
  pdfDoc.font('Helvetica-Bold');
  pdfDoc.fontSize(18);
  pdfDoc.text("E-QMS Daily Dashboard Report", { align: 'center' });
  pdfDoc.moveDown();
  
  pdfDoc.fontSize(12);
  pdfDoc.text(`Generated on ${reportDate}`, { align: 'center' });
  pdfDoc.moveDown(2);

  // Add Quality Metrics section
  pdfDoc.fontSize(14);
  pdfDoc.font('Helvetica-Bold');
  pdfDoc.text("Quality Metrics Summary");
  pdfDoc.moveDown();
  
  pdfDoc.fontSize(12);
  pdfDoc.font('Helvetica');
  
  // Create a table-like structure for metrics
  const metrics = [
    { name: "Non-Conformances", value: "5 this month (20% improvement)" },
    { name: "Corrective Actions", value: "8 in progress" },
    { name: "Audits Completed", value: "3 (2 pending)" },
    { name: "KPI Achievement", value: "92% (Target: 95%)" }
  ];
  
  metrics.forEach(metric => {
    pdfDoc.text(`${metric.name}: ${metric.value}`);
    pdfDoc.moveDown(0.5);
  });
  
  pdfDoc.moveDown();
  
  // Add Document Status section
  pdfDoc.fontSize(14);
  pdfDoc.font('Helvetica-Bold');
  pdfDoc.text("Document Status");
  pdfDoc.moveDown();
  
  pdfDoc.fontSize(12);
  pdfDoc.font('Helvetica');
  
  const documents = [
    { type: "Procedures", status: "20 of 24 approved (83%)" },
    { type: "Work Instructions", status: "36 of 42 approved (86%)" },
    { type: "Quality Records", status: "65 of 78 approved (83%)" }
  ];
  
  documents.forEach(doc => {
    pdfDoc.text(`${doc.type}: ${doc.status}`);
    pdfDoc.moveDown(0.5);
  });
  
  pdfDoc.moveDown();
  
  // Add Task Summary section
  pdfDoc.fontSize(14);
  pdfDoc.font('Helvetica-Bold');
  pdfDoc.text("Task Summary");
  pdfDoc.moveDown();
  
  pdfDoc.fontSize(12);
  pdfDoc.font('Helvetica');
  
  const tasks = [
    { name: "Tasks Due Soon", value: "8 (3 overdue)" },
    { name: "High Priority Tasks", value: "2" },
    { name: "Customer-Related Tasks", value: "5 (1 urgent)" }
  ];
  
  tasks.forEach(task => {
    pdfDoc.text(`${task.name}: ${task.value}`);
    pdfDoc.moveDown(0.5);
  });
  
  pdfDoc.moveDown();
  
  // Add Upcoming Audits section
  pdfDoc.fontSize(14);
  pdfDoc.font('Helvetica-Bold');
  pdfDoc.text("Upcoming Audits");
  pdfDoc.moveDown();
  
  pdfDoc.fontSize(12);
  pdfDoc.font('Helvetica');
  
  const audits = [
    { name: "ISO 9001:2015 Internal Audit", date: "April 20, 2025" },
    { name: "Supplier Quality Assessment", date: "April 15, 2025" },
    { name: "IATF 16949 Surveillance Audit", date: "May 10, 2025" }
  ];
  
  audits.forEach(audit => {
    pdfDoc.text(`${audit.name}: ${audit.date}`);
    pdfDoc.moveDown(0.5);
  });
  
  pdfDoc.moveDown(2);
  
  // Add footer
  pdfDoc.fontSize(10);
  pdfDoc.font('Helvetica-Italic');
  pdfDoc.text("This is an automated report from your E-QMS platform. Please do not reply to this email.", { align: 'center' });
  pdfDoc.moveDown(0.5);
  pdfDoc.text("To access detailed reports and analytics, log in to the E-QMS Dashboard.", { align: 'center' });
  
  // Finalize PDF
  return pdfDoc.end();
}

// Main function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get credential from environment variables
    const username = Deno.env.get("EMAIL_USERNAME");
    const password = Deno.env.get("EMAIL_PASSWORD");

    if (!username || !password) {
      console.error("Missing email credentials");
      return new Response(
        JSON.stringify({ error: "Email configuration is incomplete" }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Parse the request body if it exists
    let managementTeam: Employee[] | TeamMember[] = [];
    let recipients: string[] = [];
    
    try {
      if (req.method === 'POST') {
        const body: ReportRequest = await req.json();
        
        // If specific recipients are provided, use them
        if (body.recipients && body.recipients.length > 0) {
          recipients = body.recipients;
        }
        // Otherwise fetch all management team members if sendToAll is true
        else if (body.sendToAll) {
          managementTeam = await getManagementTeam();
          recipients = managementTeam.map(member => member.email);
        }
      } else {
        // For scheduled jobs (GET requests), fetch all management team members
        managementTeam = await getManagementTeam();
        recipients = managementTeam.map(member => member.email);
      }
    } catch (error) {
      console.log("No request body or error parsing it, using default behavior");
      // Default to fetching all management team if no specific request
      managementTeam = await getManagementTeam();
      recipients = managementTeam.map(member => member.email);
    }

    // If no recipients found, return error
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients specified" }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Configure SMTP client for Outlook
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.office365.com",
        port: 587,
        tls: true,
        auth: {
          username,
          password,
        },
      },
    });

    // Send emails with PDF attachments to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        // Generate PDF report
        const pdfBuffer = await generateDashboardReportPDF(recipient);
        const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        
        await client.send({
          from: username,
          to: recipient,
          subject: `E-QMS Daily Dashboard Report - ${reportDate}`,
          content: "Please find attached the daily E-QMS dashboard report. This report provides an overview of current quality metrics, document status, tasks, and upcoming audits.",
          html: `
            <p>Dear Team Member,</p>
            <p>Attached is the daily E-QMS dashboard report for ${reportDate}.</p>
            <p>This report includes:</p>
            <ul>
              <li>Key quality metrics</li>
              <li>Document approval status</li>
              <li>Task summary</li>
              <li>Upcoming audit schedule</li>
            </ul>
            <p>Please review the information and take appropriate actions where needed.</p>
            <p>Regards,<br>E-QMS System</p>
          `,
          attachments: [
            {
              filename: `E-QMS_Dashboard_Report_${reportDate.replace(/\s/g, '_')}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf"
            }
          ]
        });
        
        results.push({ recipient, status: "success" });
        console.log(`Email with PDF report sent successfully to ${recipient}`);
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error);
        results.push({ recipient, status: "failed", error: error.message });
      }
    }

    await client.close();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Dashboard reports sent to ${results.length} recipients`,
        results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in send-dashboard-report function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
