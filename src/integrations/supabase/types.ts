export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_approvals: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          status: string
          status_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          status?: string
          status_code?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          status?: string
          status_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      approval_hierarchy: {
        Row: {
          approved_at: string | null
          approver: string | null
          approver_approved: boolean | null
          checked_at: string | null
          checker: string | null
          checker_approved: boolean | null
          document_id: string | null
          id: string
          initiated_at: string | null
          initiator: string
          initiator_approved: boolean | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approver?: string | null
          approver_approved?: boolean | null
          checked_at?: string | null
          checker?: string | null
          checker_approved?: boolean | null
          document_id?: string | null
          id?: string
          initiated_at?: string | null
          initiator: string
          initiator_approved?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status: string
        }
        Update: {
          approved_at?: string | null
          approver?: string | null
          approver_approved?: boolean | null
          checked_at?: string | null
          checker?: string | null
          checker_approved?: boolean | null
          document_id?: string | null
          id?: string
          initiated_at?: string | null
          initiator?: string
          initiator_approved?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_hierarchy_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          assigned_to: string | null
          audit_id: string | null
          closed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          severity: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          audit_id?: string | null
          closed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          severity: string
          status: string
        }
        Update: {
          assigned_to?: string | null
          audit_id?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          audit_type: string
          auditor: string
          completed_at: string | null
          created_at: string
          department: string
          description: string | null
          id: string
          scheduled_date: string
          status: string
          title: string
        }
        Insert: {
          audit_type: string
          auditor: string
          completed_at?: string | null
          created_at?: string
          department: string
          description?: string | null
          id?: string
          scheduled_date: string
          status: string
          title: string
        }
        Update: {
          audit_type?: string
          auditor?: string
          completed_at?: string | null
          created_at?: string
          department?: string
          description?: string | null
          id?: string
          scheduled_date?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_permissions: {
        Row: {
          allowed_departments: string[] | null
          allowed_document_types: string[] | null
          can_approve: boolean | null
          can_check: boolean | null
          can_initiate: boolean | null
          id: string
          user_id: string | null
        }
        Insert: {
          allowed_departments?: string[] | null
          allowed_document_types?: string[] | null
          can_approve?: boolean | null
          can_check?: boolean | null
          can_initiate?: boolean | null
          id?: string
          user_id?: string | null
        }
        Update: {
          allowed_departments?: string[] | null
          allowed_document_types?: string[] | null
          can_approve?: boolean | null
          can_check?: boolean | null
          can_initiate?: boolean | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      document_revisions: {
        Row: {
          document_id: string | null
          file_name: string
          file_path: string
          id: string
          notes: string | null
          upload_date: string
          uploaded_by: string
          version: string
        }
        Insert: {
          document_id?: string | null
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          upload_date?: string
          uploaded_by: string
          version: string
        }
        Update: {
          document_id?: string | null
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          upload_date?: string
          uploaded_by?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_revisions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revisions_uploaded_by_fkey1"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          allowed_departments: string[] | null
          description: string | null
          id: string
          name: string
          required_approval_levels: string[] | null
        }
        Insert: {
          allowed_departments?: string[] | null
          description?: string | null
          id: string
          name: string
          required_approval_levels?: string[] | null
        }
        Update: {
          allowed_departments?: string[] | null
          description?: string | null
          id?: string
          name?: string
          required_approval_levels?: string[] | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          current_revision_id: string | null
          document_type: string
          file_name: string
          file_type: string
          id: string
          notes: string | null
          task_id: string | null
          upload_date: string
          uploaded_by: string
          version: string
        }
        Insert: {
          current_revision_id?: string | null
          document_type: string
          file_name: string
          file_type: string
          id?: string
          notes?: string | null
          task_id?: string | null
          upload_date?: string
          uploaded_by: string
          version: string
        }
        Update: {
          current_revision_id?: string | null
          document_type?: string
          file_name?: string
          file_type?: string
          id?: string
          notes?: string | null
          task_id?: string | null
          upload_date?: string
          uploaded_by?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey1"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department: string
          email: string
          employee_id: string
          id: string
          name: string
          password_hash: string
          phone: string | null
          position: string
          role: string
          status: string
          supervisor_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          email: string
          employee_id: string
          id?: string
          name: string
          password_hash: string
          phone?: string | null
          position: string
          role: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          email?: string
          employee_id?: string
          id?: string
          name?: string
          password_hash?: string
          phone?: string | null
          position?: string
          role?: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformance_attachments: {
        Row: {
          file_path: string
          file_size: string
          file_type: string
          id: string
          name: string
          non_conformance_id: string | null
          upload_date: string
          uploaded_by: string
        }
        Insert: {
          file_path: string
          file_size: string
          file_type: string
          id?: string
          name: string
          non_conformance_id?: string | null
          upload_date?: string
          uploaded_by: string
        }
        Update: {
          file_path?: string
          file_size?: string
          file_type?: string
          id?: string
          name?: string
          non_conformance_id?: string | null
          upload_date?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "non_conformance_attachments_non_conformance_id_fkey"
            columns: ["non_conformance_id"]
            isOneToOne: false
            referencedRelation: "non_conformances"
            referencedColumns: ["id"]
          },
        ]
      }
      non_conformances: {
        Row: {
          affected_product: string | null
          assigned_to: string
          closed_date: string | null
          containment_actions: string | null
          corrective_actions: string | null
          customer_impact: boolean | null
          customer_name: string | null
          department: string
          description: string
          due_date: string
          id: string
          is_customer_related: boolean | null
          reported_by: string
          reported_date: string
          root_cause: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          affected_product?: string | null
          assigned_to: string
          closed_date?: string | null
          containment_actions?: string | null
          corrective_actions?: string | null
          customer_impact?: boolean | null
          customer_name?: string | null
          department: string
          description: string
          due_date: string
          id?: string
          is_customer_related?: boolean | null
          reported_by: string
          reported_date?: string
          root_cause?: string | null
          severity: string
          status: string
          title: string
        }
        Update: {
          affected_product?: string | null
          assigned_to?: string
          closed_date?: string | null
          containment_actions?: string | null
          corrective_actions?: string | null
          customer_impact?: boolean | null
          customer_name?: string | null
          department?: string
          description?: string
          due_date?: string
          id?: string
          is_customer_related?: boolean | null
          reported_by?: string
          reported_date?: string
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_naming_rules: {
        Row: {
          counter_reset_frequency: string
          created_at: string | null
          description: string | null
          due_date_interval_unit: string | null
          due_date_interval_value: number | null
          frequency: string
          id: string
          is_active: boolean | null
          naming_pattern: string
        }
        Insert: {
          counter_reset_frequency: string
          created_at?: string | null
          description?: string | null
          due_date_interval_unit?: string | null
          due_date_interval_value?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          naming_pattern: string
        }
        Update: {
          counter_reset_frequency?: string
          created_at?: string | null
          description?: string | null
          due_date_interval_unit?: string | null
          due_date_interval_value?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          naming_pattern?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          file_path: string
          file_size: string
          file_type: string
          id: string
          name: string
          task_id: string | null
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          file_path: string
          file_size: string
          file_type: string
          id?: string
          name: string
          task_id?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          file_path?: string
          file_size?: string
          file_type?: string
          id?: string
          name?: string
          task_id?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_automation_error_log: {
        Row: {
          error_details: string | null
          error_message: string | null
          function_name: string
          id: number
          logged_at: string
          params: Json | null
        }
        Insert: {
          error_details?: string | null
          error_message?: string | null
          function_name: string
          id?: never
          logged_at?: string
          params?: Json | null
        }
        Update: {
          error_details?: string | null
          error_message?: string | null
          function_name?: string
          id?: never
          logged_at?: string
          params?: Json | null
        }
        Relationships: []
      }
      task_recurrence_rules_config: {
        Row: {
          description: string | null
          frequency: string
          id: number
          interval_unit: string
          interval_value: number
          naming_period_format: string
          naming_prefix: string
        }
        Insert: {
          description?: string | null
          frequency: string
          id?: number
          interval_unit: string
          interval_value: number
          naming_period_format: string
          naming_prefix: string
        }
        Update: {
          description?: string | null
          frequency?: string
          id?: number
          interval_unit?: string
          interval_value?: number
          naming_period_format?: string
          naming_prefix?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          assignee: string | null
          attachments_required: string
          comments: string | null
          created_at: string
          customer_name: string | null
          department: string
          department_head_id: string | null
          description: string | null
          due_date: string | null
          end_date: string | null
          id: string
          is_customer_related: boolean | null
          is_generated: boolean | null
          is_recurring: boolean | null
          is_recurring_parent: boolean | null
          is_template: boolean | null
          last_generated_date: string | null
          original_task_name: string | null
          parent_task_id: string | null
          priority: string
          recurrence_count_in_period: number | null
          recurring_frequency: string | null
          recurring_parent_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assignee?: string | null
          attachments_required: string
          comments?: string | null
          created_at?: string
          customer_name?: string | null
          department: string
          department_head_id?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_customer_related?: boolean | null
          is_generated?: boolean | null
          is_recurring?: boolean | null
          is_recurring_parent?: boolean | null
          is_template?: boolean | null
          last_generated_date?: string | null
          original_task_name?: string | null
          parent_task_id?: string | null
          priority: string
          recurrence_count_in_period?: number | null
          recurring_frequency?: string | null
          recurring_parent_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assignee?: string | null
          attachments_required?: string
          comments?: string | null
          created_at?: string
          customer_name?: string | null
          department?: string
          department_head_id?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_customer_related?: boolean | null
          is_generated?: boolean | null
          is_recurring?: boolean | null
          is_recurring_parent?: boolean | null
          is_template?: boolean | null
          last_generated_date?: string | null
          original_task_name?: string | null
          parent_task_id?: string | null
          priority?: string
          recurrence_count_in_period?: number | null
          recurring_frequency?: string | null
          recurring_parent_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_fkey1"
            columns: ["assignee"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurring_parent_id_fkey"
            columns: ["recurring_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          department_id: string | null
          email: string
          id: string
          initials: string
          name: string
          position: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          department_id?: string | null
          email: string
          id?: string
          initials: string
          name: string
          position: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          department_id?: string | null
          email?: string
          id?: string
          initials?: string
          name?: string
          position?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_recurring_frequency_rule: {
        Args: {
          freq: string
          pattern: string
          counter_reset: string
          interval_value: number
          interval_unit: string
          rule_description?: string
        }
        Returns: boolean
      }
      calculate_due_date: {
        Args: { start_date: string; frequency: string }
        Returns: string
      }
      calculate_next_due_date: {
        Args:
          | { current_due_date: string; frequency: string }
          | { current_due_date: string; frequency: string }
        Returns: string
      }
      calculate_recurring_counter: {
        Args: { template_id: string; frequency: string; target_date: string }
        Returns: number
      }
      complete_task_and_generate_next: {
        Args: { task_id: string }
        Returns: Json
      }
      create_first_recurring_instance: {
        Args:
          | { p_parent_task_id: string; p_custom_due_date?: string }
          | { template_id: string }
        Returns: string
      }
      create_pending_first_instances: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_recurring_parent_with_first_instance: {
        Args: {
          p_organization_id: string
          p_name: string
          p_description: string
          p_assignee_id: string
          p_department_id: string
          p_frequency: string
          p_series_start_date: string
          p_series_end_date: string
          p_created_by: string
        }
        Returns: Json
      }
      generate_instance_name: {
        Args: { template_title: string; frequency: string; due_date: string }
        Returns: string
      }
      get_month_abbrev: {
        Args: { date_input: string }
        Returns: string
      }
      get_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          due_date: string
          status: string
          assignee: string
          department: string
          priority: string
          is_template: boolean
          days_overdue: number
        }[]
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      mark_tasks_overdue: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      mark_tasks_overdue_simple: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      run_task_automation: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      send_overdue_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      test_overdue_logic: {
        Args: Record<PropertyKey, never>
        Returns: {
          task_id: string
          title: string
          status: string
          due_date: string
          would_be_marked_overdue: boolean
        }[]
      }
      update_profile: {
        Args: {
          user_id: string
          first_name_val: string
          last_name_val: string
          email_val: string
        }
        Returns: undefined
      }
      update_recurring_due_date_interval: {
        Args: {
          freq: string
          new_interval_value: number
          new_interval_unit: string
        }
        Returns: boolean
      }
      update_recurring_naming_pattern: {
        Args: { freq: string; new_pattern: string }
        Returns: boolean
      }
      update_template_name_cascade: {
        Args: { template_id: string; new_title: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user", "viewer"],
    },
  },
} as const
