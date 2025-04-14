
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HROneEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  employeeId: string;
  status: string;
}

interface HROneDepartment {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  managerId: string | null;
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hroneApiKey = Deno.env.get("HRONE_API_KEY");
    const hroneEndpoint = Deno.env.get("HRONE_API_ENDPOINT");

    if (!hroneApiKey || !hroneEndpoint) {
      return new Response(
        JSON.stringify({ error: "HROne API configuration is missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();
    console.log(`Processing ${action} request for HROne integration`);

    // Determine which action to perform
    switch (action) {
      case "import_employees": {
        // Fetch employees from HROne
        const hroneEmployees = await fetchEmployeesFromHROne(hroneEndpoint, hroneApiKey);
        
        // Update local database with HROne data
        const result = await importEmployeesToDatabase(supabase, hroneEmployees);
        
        return new Response(
          JSON.stringify({ success: true, message: "Employees imported successfully", result }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case "import_departments": {
        // Fetch departments from HROne
        const hroneDepartments = await fetchDepartmentsFromHROne(hroneEndpoint, hroneApiKey);
        
        // Update local database with HROne data
        const result = await importDepartmentsToDatabase(supabase, hroneDepartments);
        
        return new Response(
          JSON.stringify({ success: true, message: "Departments imported successfully", result }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case "export_employees": {
        // Fetch employees from our database
        const { data: employees, error } = await supabase
          .from("team_members")
          .select("*");
          
        if (error) throw error;
        
        // Transform and export to HROne
        const result = await exportEmployeesToHROne(hroneEndpoint, hroneApiKey, employees);
        
        return new Response(
          JSON.stringify({ success: true, message: "Employees exported successfully", result }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case "export_departments": {
        // Fetch departments from our database
        const { data: departments, error } = await supabase
          .from("departments")
          .select("*");
          
        if (error) throw error;
        
        // Transform and export to HROne
        const result = await exportDepartmentsToHROne(hroneEndpoint, hroneApiKey, departments);
        
        return new Response(
          JSON.stringify({ success: true, message: "Departments exported successfully", result }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      case "sync": {
        // Perform bidirectional sync of both employees and departments
        const employeeResult = await performSync(supabase, hroneEndpoint, hroneApiKey, "employees");
        const departmentResult = await performSync(supabase, hroneEndpoint, hroneApiKey, "departments");
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Sync completed", 
            employees: employeeResult, 
            departments: departmentResult 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action specified" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error in hrone-integration function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to fetch employees from HROne API
async function fetchEmployeesFromHROne(endpoint: string, apiKey: string): Promise<HROneEmployee[]> {
  try {
    const response = await fetch(`${endpoint}/employees`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} employees from HROne`);
    return data;
  } catch (error) {
    console.error("Error fetching employees from HROne:", error);
    throw error;
  }
}

// Function to fetch departments from HROne API
async function fetchDepartmentsFromHROne(endpoint: string, apiKey: string): Promise<HROneDepartment[]> {
  try {
    const response = await fetch(`${endpoint}/departments`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Retrieved ${data.length} departments from HROne`);
    return data;
  } catch (error) {
    console.error("Error fetching departments from HROne:", error);
    throw error;
  }
}

// Function to import employees to our database
async function importEmployeesToDatabase(supabase, employees: HROneEmployee[]) {
  console.log(`Importing ${employees.length} employees to database`);
  
  // Map HROne employee data to our database structure
  const mappedEmployees = employees.map(emp => ({
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    position: emp.position,
    // We'll need to find the matching department ID based on name
    // This is a simplification - real implementation would need to match departments
    department_id: null,
    external_id: emp.id,
    employee_id: emp.employeeId,
    status: emp.status === "Active" ? "Active" : "Inactive",
    initials: `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase(),
  }));
  
  // For each employee, we'll upsert (insert or update)
  const { data, error } = await supabase
    .from("team_members")
    .upsert(mappedEmployees, { 
      onConflict: "email",
      returning: "minimal"
    });
  
  if (error) {
    console.error("Error importing employees:", error);
    throw error;
  }
  
  return { imported: employees.length };
}

// Function to import departments to our database
async function importDepartmentsToDatabase(supabase, departments: HROneDepartment[]) {
  console.log(`Importing ${departments.length} departments to database`);
  
  // Map HROne department data to our database structure
  const mappedDepartments = departments.map(dept => ({
    name: dept.name,
    external_id: dept.id,
    parent_id: dept.parentDepartmentId,
    description: dept.description,
  }));
  
  // For each department, we'll upsert (insert or update)
  const { data, error } = await supabase
    .from("departments")
    .upsert(mappedDepartments, { 
      onConflict: "external_id",
      returning: "minimal" 
    });
  
  if (error) {
    console.error("Error importing departments:", error);
    throw error;
  }
  
  return { imported: departments.length };
}

// Function to export employees to HROne
async function exportEmployeesToHROne(endpoint: string, apiKey: string, employees) {
  try {
    console.log(`Exporting ${employees.length} employees to HROne`);
    
    const mappedEmployees = employees.map(emp => {
      // Split name into first and last name
      const nameParts = emp.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      return {
        id: emp.external_id, // Only for existing employees in HROne
        firstName,
        lastName,
        email: emp.email,
        position: emp.position,
        department: emp.department_name || "",
        employeeId: emp.employee_id || "",
        status: emp.status || "Active"
      };
    });
    
    const response = await fetch(`${endpoint}/employees/batch`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mappedEmployees),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export employees: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error exporting employees to HROne:", error);
    throw error;
  }
}

// Function to export departments to HROne
async function exportDepartmentsToHROne(endpoint: string, apiKey: string, departments) {
  try {
    console.log(`Exporting ${departments.length} departments to HROne`);
    
    const mappedDepartments = departments.map(dept => {
      return {
        id: dept.external_id, // Only for existing departments in HROne
        name: dept.name,
        parentDepartmentId: dept.parent_id,
        description: dept.description || ""
      };
    });
    
    const response = await fetch(`${endpoint}/departments/batch`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mappedDepartments),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export departments: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error exporting departments to HROne:", error);
    throw error;
  }
}

// Function to perform bidirectional sync
async function performSync(supabase, endpoint: string, apiKey: string, entityType: "employees" | "departments") {
  try {
    console.log(`Performing sync for ${entityType}`);
    
    if (entityType === "employees") {
      // Fetch from HROne and update our database
      const hroneEmployees = await fetchEmployeesFromHROne(endpoint, apiKey);
      const importResult = await importEmployeesToDatabase(supabase, hroneEmployees);
      
      // Then fetch from our database and update HROne
      const { data: employees, error } = await supabase
        .from("team_members")
        .select("*");
        
      if (error) throw error;
      
      const exportResult = await exportEmployeesToHROne(endpoint, apiKey, employees);
      
      return { imported: importResult.imported, exported: employees.length };
    } else {
      // Fetch from HROne and update our database
      const hroneDepartments = await fetchDepartmentsFromHROne(endpoint, apiKey);
      const importResult = await importDepartmentsToDatabase(supabase, hroneDepartments);
      
      // Then fetch from our database and update HROne
      const { data: departments, error } = await supabase
        .from("departments")
        .select("*");
        
      if (error) throw error;
      
      const exportResult = await exportDepartmentsToHROne(endpoint, apiKey, departments);
      
      return { imported: importResult.imported, exported: departments.length };
    }
  } catch (error) {
    console.error(`Error performing sync for ${entityType}:`, error);
    throw error;
  }
}
