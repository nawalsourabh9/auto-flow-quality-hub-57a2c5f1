import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

// Function to generate an HTML report based on dashboard data
function generateDashboardReport(recipient: string): string {
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0056b3; color: white; padding: 10px 20px; border-radius: 4px; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
          .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .metric-name { font-weight: bold; }
          .chart-placeholder { height: 200px; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
          .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
          .priority-high { color: #dc3545; }
          .priority-medium { color: #fd7e14; }
          .priority-low { color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-QMS Daily Dashboard Report</h1>
            <p>Generated on ${reportDate}</p>
          </div>
          
          <div class="section">
            <h2>Quality Metrics Summary</h2>
            <div class="metric">
              <span class="metric-name">Non-Conformances:</span>
              <span>5 this month (20% improvement)</span>
            </div>
            <div class="metric">
              <span class="metric-name">Corrective Actions:</span>
              <span>8 in progress</span>
            </div>
            <div class="metric">
              <span class="metric-name">Audits Completed:</span>
              <span>3 (2 pending)</span>
            </div>
            <div class="metric">
              <span class="metric-name">KPI Achievement:</span>
              <span>92% (Target: 95%)</span>
            </div>
            <div class="chart-placeholder">
              Quality Metrics Chart Visualization
            </div>
          </div>
          
          <div class="section">
            <h2>Document Status</h2>
            <div class="metric">
              <span class="metric-name">Procedures:</span>
              <span>20 of 24 approved (83%)</span>
            </div>
            <div class="metric">
              <span class="metric-name">Work Instructions:</span>
              <span>36 of 42 approved (86%)</span>
            </div>
            <div class="metric">
              <span class="metric-name">Quality Records:</span>
              <span>65 of 78 approved (83%)</span>
            </div>
          </div>
          
          <div class="section">
            <h2>Task Summary</h2>
            <div class="metric">
              <span class="metric-name">Tasks Due Soon:</span>
              <span>8 (3 overdue)</span>
            </div>
            <div class="metric">
              <span class="metric-name">High Priority Tasks:</span>
              <span class="priority-high">2</span>
            </div>
            <div class="metric">
              <span class="metric-name">Customer-Related Tasks:</span>
              <span>5 (1 urgent)</span>
            </div>
          </div>
          
          <div class="section">
            <h2>Upcoming Audits</h2>
            <div class="metric">
              <span class="metric-name">ISO 9001:2015 Internal Audit:</span>
              <span>April 20, 2025</span>
            </div>
            <div class="metric">
              <span class="metric-name">Supplier Quality Assessment:</span>
              <span>April 15, 2025</span>
            </div>
            <div class="metric">
              <span class="metric-name">IATF 16949 Surveillance Audit:</span>
              <span>May 10, 2025</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated report from your E-QMS platform. Please do not reply to this email.</p>
            <p>To access detailed reports and analytics, log in to the <a href="#">E-QMS Dashboard</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

    // Send emails to all recipients
    const results = [];
    for (const recipient of recipients) {
      try {
        const reportHtml = generateDashboardReport(recipient);
        
        await client.send({
          from: username,
          to: recipient,
          subject: "E-QMS Daily Dashboard Report",
          content: "Please view this email with an HTML-compatible email client.",
          html: reportHtml,
        });
        
        results.push({ recipient, status: "success" });
        console.log(`Email sent successfully to ${recipient}`);
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
