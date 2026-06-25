export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      associate_availability: {
        Row: {
          associate_id: number
          availability_id: number
          created_at: string
          reason: string | null
          shift_id: number | null
          unavailable_date: string
        }
        Insert: {
          associate_id: number
          availability_id?: number
          created_at?: string
          reason?: string | null
          shift_id?: number | null
          unavailable_date: string
        }
        Update: {
          associate_id?: number
          availability_id?: number
          created_at?: string
          reason?: string | null
          shift_id?: number | null
          unavailable_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "associate_availability_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["associate_id"]
          },
          {
            foreignKeyName: "associate_availability_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["shift_id"]
          },
        ]
      }
      associate_skills: {
        Row: {
          assoc_skill_id: number
          associate_id: number
          certified_by: string | null
          certified_on: string | null
          created_at: string
          expires_on: string | null
          is_valid: boolean
          skill_id: number
          skill_level: Database["public"]["Enums"]["skill_level"]
        }
        Insert: {
          assoc_skill_id?: number
          associate_id: number
          certified_by?: string | null
          certified_on?: string | null
          created_at?: string
          expires_on?: string | null
          is_valid?: boolean
          skill_id: number
          skill_level: Database["public"]["Enums"]["skill_level"]
        }
        Update: {
          assoc_skill_id?: number
          associate_id?: number
          certified_by?: string | null
          certified_on?: string | null
          created_at?: string
          expires_on?: string | null
          is_valid?: boolean
          skill_id?: number
          skill_level?: Database["public"]["Enums"]["skill_level"]
        }
        Relationships: [
          {
            foreignKeyName: "associate_skills_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["associate_id"]
          },
          {
            foreignKeyName: "associate_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      associates: {
        Row: {
          associate_id: number
          category: Database["public"]["Enums"]["associate_category"]
          contact_number: string | null
          created_at: string
          department_id: number | null
          employee_code: string
          full_name: string
          joining_date: string | null
          status: Database["public"]["Enums"]["associate_status"]
        }
        Insert: {
          associate_id?: number
          category: Database["public"]["Enums"]["associate_category"]
          contact_number?: string | null
          created_at?: string
          department_id?: number | null
          employee_code: string
          full_name: string
          joining_date?: string | null
          status?: Database["public"]["Enums"]["associate_status"]
        }
        Update: {
          associate_id?: number
          category?: Database["public"]["Enums"]["associate_category"]
          contact_number?: string | null
          created_at?: string
          department_id?: number | null
          employee_code?: string
          full_name?: string
          joining_date?: string | null
          status?: Database["public"]["Enums"]["associate_status"]
        }
        Relationships: [
          {
            foreignKeyName: "associates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          audit_id: number
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          performed_by: string | null
          record_pk: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          audit_id?: number
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_pk: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          audit_id?: number
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          performed_by?: string | null
          record_pk?: string
          table_name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          department_id: number
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          department_id?: number
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          department_id?: number
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      machine_skill_requirements: {
        Row: {
          machine_id: number
          min_level: Database["public"]["Enums"]["skill_level"]
          skill_id: number
        }
        Insert: {
          machine_id: number
          min_level?: Database["public"]["Enums"]["skill_level"]
          skill_id: number
        }
        Update: {
          machine_id?: number
          min_level?: Database["public"]["Enums"]["skill_level"]
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "machine_skill_requirements_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "machine_skill_requirements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string
          is_active: boolean
          line_id: number | null
          machine_code: string
          machine_id: number
          machine_name: string
          min_skill_level: Database["public"]["Enums"]["skill_level"]
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          line_id?: number | null
          machine_code: string
          machine_id?: number
          machine_name: string
          min_skill_level?: Database["public"]["Enums"]["skill_level"]
        }
        Update: {
          created_at?: string
          is_active?: boolean
          line_id?: number | null
          machine_code?: string
          machine_id?: number
          machine_name?: string
          min_skill_level?: Database["public"]["Enums"]["skill_level"]
        }
        Relationships: [
          {
            foreignKeyName: "machines_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["line_id"]
          },
        ]
      }
      production_lines: {
        Row: {
          area: string | null
          created_at: string
          department_id: number | null
          is_active: boolean
          line_id: number
          line_name: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          department_id?: number | null
          is_active?: boolean
          line_id?: number
          line_name: string
        }
        Update: {
          area?: string | null
          created_at?: string
          department_id?: number | null
          is_active?: boolean
          line_id?: number
          line_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
        ]
      }
      profiles: {
        Row: {
          associate_id: number | null
          created_at: string
          full_name: string | null
          is_active: boolean
          user_id: string
          username: string
        }
        Insert: {
          associate_id?: number | null
          created_at?: string
          full_name?: string | null
          is_active?: boolean
          user_id: string
          username: string
        }
        Update: {
          associate_id?: number | null
          created_at?: string
          full_name?: string | null
          is_active?: boolean
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_associate_fk"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["associate_id"]
          },
        ]
      }
      shift_allocations: {
        Row: {
          allocated_at: string
          allocated_by: string
          allocation_date: string
          allocation_id: number
          associate_id: number
          machine_id: number
          override_reason: string | null
          shift_id: number
          status: Database["public"]["Enums"]["allocation_status"]
        }
        Insert: {
          allocated_at?: string
          allocated_by: string
          allocation_date: string
          allocation_id?: number
          associate_id: number
          machine_id: number
          override_reason?: string | null
          shift_id: number
          status?: Database["public"]["Enums"]["allocation_status"]
        }
        Update: {
          allocated_at?: string
          allocated_by?: string
          allocation_date?: string
          allocation_id?: number
          associate_id?: number
          machine_id?: number
          override_reason?: string | null
          shift_id?: number
          status?: Database["public"]["Enums"]["allocation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shift_allocations_associate_id_fkey"
            columns: ["associate_id"]
            isOneToOne: false
            referencedRelation: "associates"
            referencedColumns: ["associate_id"]
          },
          {
            foreignKeyName: "shift_allocations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "shift_allocations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["shift_id"]
          },
        ]
      }
      shifts: {
        Row: {
          end_time: string
          is_active: boolean
          shift_id: number
          shift_name: string
          start_time: string
        }
        Insert: {
          end_time: string
          is_active?: boolean
          shift_id?: number
          shift_name: string
          start_time: string
        }
        Update: {
          end_time?: string
          is_active?: boolean
          shift_id?: number
          shift_name?: string
          start_time?: string
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          description: string | null
          is_active: boolean
          skill_code: string
          skill_id: number
          skill_name: string
        }
        Insert: {
          description?: string | null
          is_active?: boolean
          skill_code: string
          skill_id?: number
          skill_name: string
        }
        Update: {
          description?: string | null
          is_active?: boolean
          skill_code?: string
          skill_id?: number
          skill_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
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
      get_eligible_associates: {
        Args: { _date: string; _machine_id: number; _shift_id: number }
        Returns: {
          associate_id: number
          category: Database["public"]["Enums"]["associate_category"]
          deployment_count_on_machine: number
          eligibility_status: string
          employee_code: string
          expiring_skills: Json
          full_name: string
          highest_relevant_level: Database["public"]["Enums"]["skill_level"]
        }[]
      }
      get_skill_gap: {
        Args: { p_line_id?: number }
        Returns: {
          certified_count: number
          expert_count: number
          line_id: number
          line_name: string
          machine_code: string
          machine_id: number
          machine_name: string
          operator_count: number
          total_count: number
          trainee_count: number
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      skill_level_rank: {
        Args: { _lvl: Database["public"]["Enums"]["skill_level"] }
        Returns: number
      }
    }
    Enums: {
      allocation_status: "CONFIRMED" | "OVERRIDE" | "CANCELLED"
      app_role:
        | "PLANT_ADMIN"
        | "HR_COORDINATOR"
        | "SUPERVISOR"
        | "PLANT_MANAGER"
      associate_category:
        | "CONTRACT"
        | "COMPANY_OPERATIVE"
        | "SUPERVISOR"
        | "NTCI"
      associate_status: "ACTIVE" | "INACTIVE" | "SEPARATED"
      audit_action: "INSERT" | "UPDATE" | "DELETE"
      skill_level: "TRAINEE" | "OPERATOR" | "CERTIFIED" | "EXPERT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      allocation_status: ["CONFIRMED", "OVERRIDE", "CANCELLED"],
      app_role: [
        "PLANT_ADMIN",
        "HR_COORDINATOR",
        "SUPERVISOR",
        "PLANT_MANAGER",
      ],
      associate_category: [
        "CONTRACT",
        "COMPANY_OPERATIVE",
        "SUPERVISOR",
        "NTCI",
      ],
      associate_status: ["ACTIVE", "INACTIVE", "SEPARATED"],
      audit_action: ["INSERT", "UPDATE", "DELETE"],
      skill_level: ["TRAINEE", "OPERATOR", "CERTIFIED", "EXPERT"],
    },
  },
} as const
