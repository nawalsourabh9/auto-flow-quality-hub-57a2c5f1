const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://sibaigcaglcmhfhvrwol.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYmFpZ2NhZ2xjbWhmaHZyd29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTQxMjUsImV4cCI6MjA1OTY3MDEyNX0.glqXwvhDZ9jSEE81JimH1gt-jHgaYyIh0svj5Q07PZw";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    
    const migrationPath = './supabase/migrations/20250613_fix_days_calculation_error.sql';
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration to fix days calculation error...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    console.log('The "invalid input syntax for type integer" error should now be fixed.');
    
  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

// Run the migration
applyMigration();
