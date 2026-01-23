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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      council_opinions: {
        Row: {
          created_at: string
          created_by: string
          dissenting_notes: string | null
          file_id: string | null
          id: string
          invoked_rules: string[] | null
          options: Json
          recommendation: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dissenting_notes?: string | null
          file_id?: string | null
          id?: string
          invoked_rules?: string[] | null
          options?: Json
          recommendation?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dissenting_notes?: string | null
          file_id?: string | null
          id?: string
          invoked_rules?: string[] | null
          options?: Json
          recommendation?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_opinions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      events_registry: {
        Row: {
          created_at: string
          created_by: string
          description: string
          event_date: string
          event_type: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          event_date?: string
          event_type?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string
          event_type?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exit_requests: {
        Row: {
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["initiation_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["initiation_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["initiation_status"]
          user_id?: string
        }
        Relationships: []
      }
      file_events: {
        Row: {
          created_at: string
          event_id: string
          file_id: string
          id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          file_id: string
          id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_events_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_relationships: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          source_file_id: string
          target_file_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          source_file_id: string
          target_file_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          source_file_id?: string
          target_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_relationships_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_relationships_target_file_id_fkey"
            columns: ["target_file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
        ]
      }
      initiation_requests: {
        Row: {
          created_at: string
          desired_pseudonym: string
          email: string
          id: string
          motivation: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["initiation_status"]
        }
        Insert: {
          created_at?: string
          desired_pseudonym: string
          email: string
          id?: string
          motivation: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["initiation_status"]
        }
        Update: {
          created_at?: string
          desired_pseudonym?: string
          email?: string
          id?: string
          motivation?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["initiation_status"]
        }
        Relationships: []
      }
      judgments: {
        Row: {
          created_at: string
          created_by: string
          decision: string
          effects: Json
          executed_at: string | null
          file_id: string | null
          id: string
          opinion_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          decision: string
          effects?: Json
          executed_at?: string | null
          file_id?: string | null
          id?: string
          opinion_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decision?: string
          effects?: Json
          executed_at?: string | null
          file_id?: string | null
          id?: string
          opinion_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "judgments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "council_opinions"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          alias: string | null
          council_notes: string | null
          created_at: string
          created_by: string
          description: string | null
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          name: string
          narrative_status: Database["public"]["Enums"]["narrative_status"]
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          council_notes?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          name: string
          narrative_status?: Database["public"]["Enums"]["narrative_status"]
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          council_notes?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          name?: string
          narrative_status?: Database["public"]["Enums"]["narrative_status"]
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      living_rules: {
        Row: {
          council_comments: string | null
          created_at: string
          created_by: string
          id: string
          interpretations: string[] | null
          is_active: boolean
          precedents: string[] | null
          rule_text: string
          title: string
          updated_at: string
        }
        Insert: {
          council_comments?: string | null
          created_at?: string
          created_by: string
          id?: string
          interpretations?: string[] | null
          is_active?: boolean
          precedents?: string[] | null
          rule_text: string
          title: string
          updated_at?: string
        }
        Update: {
          council_comments?: string | null
          created_at?: string
          created_by?: string
          id?: string
          interpretations?: string[] | null
          is_active?: boolean
          precedents?: string[] | null
          rule_text?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opinion_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          opinion_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          opinion_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          opinion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opinion_comments_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "council_opinions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          grade: Database["public"]["Enums"]["initiate_grade"]
          id: string
          joined_at: string
          pseudonym: string
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade?: Database["public"]["Enums"]["initiate_grade"]
          id: string
          joined_at?: string
          pseudonym: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade?: Database["public"]["Enums"]["initiate_grade"]
          id?: string
          joined_at?: string
          pseudonym?: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          is_reviewed: boolean
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_reviewed?: boolean
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_reviewed?: boolean
          reason?: string
          reported_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      rule_opinions: {
        Row: {
          created_at: string
          id: string
          opinion_id: string
          rule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opinion_id: string
          rule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opinion_id?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_opinions_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "council_opinions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_opinions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "living_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_knowledge_access: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_guardian_supreme: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "guardian_supreme" | "initiate" | "archonte"
      file_type: "internal" | "external"
      initiate_grade:
        | "novice"
        | "apprenti"
        | "compagnon"
        | "maitre"
        | "sage"
        | "oracle"
      initiation_status: "pending" | "approved" | "rejected"
      judgment_effect:
        | "rank_change"
        | "access_grant"
        | "access_revoke"
        | "symbolic_status"
        | "other"
      member_status:
        | "active"
        | "under_surveillance"
        | "pending"
        | "exclusion_requested"
      narrative_status:
        | "neutral"
        | "observed"
        | "ally"
        | "at_risk"
        | "protected"
        | "unknown"
      relationship_type:
        | "alliance"
        | "conflict"
        | "influence"
        | "observation"
        | "unknown"
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
      app_role: ["guardian_supreme", "initiate", "archonte"],
      file_type: ["internal", "external"],
      initiate_grade: [
        "novice",
        "apprenti",
        "compagnon",
        "maitre",
        "sage",
        "oracle",
      ],
      initiation_status: ["pending", "approved", "rejected"],
      judgment_effect: [
        "rank_change",
        "access_grant",
        "access_revoke",
        "symbolic_status",
        "other",
      ],
      member_status: [
        "active",
        "under_surveillance",
        "pending",
        "exclusion_requested",
      ],
      narrative_status: [
        "neutral",
        "observed",
        "ally",
        "at_risk",
        "protected",
        "unknown",
      ],
      relationship_type: [
        "alliance",
        "conflict",
        "influence",
        "observation",
        "unknown",
      ],
    },
  },
} as const
