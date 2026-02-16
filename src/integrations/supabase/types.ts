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
      action_history: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          actor_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          actor_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          actor_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          activity_type: string
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          metadata: Json | null
          title: string
        }
        Insert: {
          activity_type?: string
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          metadata?: Json | null
          title: string
        }
        Update: {
          activity_type?: string
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          rarity: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          rarity?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
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
      council_requests: {
        Row: {
          council_response: string | null
          created_at: string
          id: string
          message: string
          request_type: Database["public"]["Enums"]["request_type"]
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          council_response?: string | null
          created_at?: string
          id?: string
          message: string
          request_type: Database["public"]["Enums"]["request_type"]
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          council_response?: string | null
          created_at?: string
          id?: string
          message?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      council_votes: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          opinion_id: string
          vote: Database["public"]["Enums"]["vote_choice"]
          voter_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          opinion_id: string
          vote: Database["public"]["Enums"]["vote_choice"]
          voter_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          opinion_id?: string
          vote?: Database["public"]["Enums"]["vote_choice"]
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_votes_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "council_opinions"
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
      file_annotations: {
        Row: {
          annotation_type: string
          author_id: string
          content: string
          created_at: string
          file_id: string
          id: string
          is_private: boolean
          updated_at: string
        }
        Insert: {
          annotation_type?: string
          author_id: string
          content: string
          created_at?: string
          file_id: string
          id?: string
          is_private?: boolean
          updated_at?: string
        }
        Update: {
          annotation_type?: string
          author_id?: string
          content?: string
          created_at?: string
          file_id?: string
          id?: string
          is_private?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_annotations_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
        ]
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
      file_tag_assignments: {
        Row: {
          created_at: string
          file_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_tag_assignments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "file_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      file_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      group_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          min_grade: string | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          min_grade?: string | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          min_grade?: string | null
          name?: string
        }
        Relationships: []
      }
      group_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "group_channels"
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
          is_sealed: boolean
          name: string
          narrative_status: Database["public"]["Enums"]["narrative_status"]
          profile_id: string | null
          sealed_by: string | null
          sealed_reason: string | null
          unseal_condition: string | null
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
          is_sealed?: boolean
          name: string
          narrative_status?: Database["public"]["Enums"]["narrative_status"]
          profile_id?: string | null
          sealed_by?: string | null
          sealed_reason?: string | null
          unseal_condition?: string | null
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
          is_sealed?: boolean
          name?: string
          narrative_status?: Database["public"]["Enums"]["narrative_status"]
          profile_id?: string | null
          sealed_by?: string | null
          sealed_reason?: string | null
          unseal_condition?: string | null
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
      knowledge_suggestions: {
        Row: {
          created_at: string
          dismissed_by: string | null
          id: string
          is_dismissed: boolean
          reason: string
          source_id: string
          source_type: string
          suggestion_type: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          dismissed_by?: string | null
          id?: string
          is_dismissed?: boolean
          reason: string
          source_id: string
          source_type: string
          suggestion_type: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          dismissed_by?: string | null
          id?: string
          is_dismissed?: boolean
          reason?: string
          source_id?: string
          source_type?: string
          suggestion_type?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      knowledge_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          file_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          file_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          file_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_tasks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "knowledge_files"
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
          attachments: Json | null
          content: string
          conversation_id: string | null
          created_at: string
          edited_at: string | null
          id: string
          is_read: boolean
          message_type: string
          parent_message_id: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          parent_message_id?: string | null
          recipient_id: string
          sender_id: string
          subject: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          parent_message_id?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
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
      personal_journal: {
        Row: {
          content: string
          created_at: string
          id: string
          mood: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          grade: Database["public"]["Enums"]["initiate_grade"]
          id: string
          joined_at: string
          pseudonym: string
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          grade?: Database["public"]["Enums"]["initiate_grade"]
          id: string
          joined_at?: string
          pseudonym: string
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
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
      system_state: {
        Row: {
          alert_message: string | null
          alert_state: Database["public"]["Enums"]["alert_state"]
          changed_at: string
          changed_by: string | null
          id: string
        }
        Insert: {
          alert_message?: string | null
          alert_state?: Database["public"]["Enums"]["alert_state"]
          changed_at?: string
          changed_by?: string | null
          id?: string
        }
        Update: {
          alert_message?: string | null
          alert_state?: Database["public"]["Enums"]["alert_state"]
          changed_at?: string
          changed_by?: string | null
          id?: string
        }
        Relationships: []
      }
      temporary_access: {
        Row: {
          created_at: string
          expires_at: string
          granted_by: string
          id: string
          reason: string | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          granted_by: string
          id?: string
          reason?: string | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_by?: string
          id?: string
          reason?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      tribunal_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          sender_id: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          sender_id: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribunal_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tribunal_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tribunal_participants: {
        Row: {
          admitted_at: string | null
          id: string
          invited_at: string
          notes: string | null
          role: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          admitted_at?: string | null
          id?: string
          invited_at?: string
          notes?: string | null
          role?: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          admitted_at?: string | null
          id?: string
          invited_at?: string
          notes?: string | null
          role?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribunal_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tribunal_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tribunal_sessions: {
        Row: {
          accused_id: string | null
          created_at: string
          daily_room_name: string | null
          daily_room_url: string | null
          description: string | null
          ended_at: string | null
          id: string
          presided_by: string
          scheduled_at: string
          session_type: string
          started_at: string | null
          status: string
          title: string
          updated_at: string
          verdict: string | null
          verdict_details: string | null
        }
        Insert: {
          accused_id?: string | null
          created_at?: string
          daily_room_name?: string | null
          daily_room_url?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          presided_by: string
          scheduled_at: string
          session_type?: string
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          verdict?: string | null
          verdict_details?: string | null
        }
        Update: {
          accused_id?: string | null
          created_at?: string
          daily_room_name?: string | null
          daily_room_url?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          presided_by?: string
          scheduled_at?: string
          session_type?: string
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          verdict?: string | null
          verdict_details?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string
          badge_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by: string
          badge_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string
          badge_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
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
      action_type:
        | "file_created"
        | "file_updated"
        | "file_deleted"
        | "judgment_issued"
        | "status_changed"
        | "vote_cast"
        | "request_submitted"
        | "request_resolved"
        | "opinion_created"
        | "event_created"
        | "rule_created"
        | "alert_changed"
      alert_state: "normal" | "vigilance" | "crise"
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
      request_status: "pending" | "approved" | "rejected" | "adjourned"
      request_type:
        | "entry"
        | "exit"
        | "pardon"
        | "access"
        | "promotion"
        | "other"
      vote_choice: "pour" | "contre" | "abstention"
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
      action_type: [
        "file_created",
        "file_updated",
        "file_deleted",
        "judgment_issued",
        "status_changed",
        "vote_cast",
        "request_submitted",
        "request_resolved",
        "opinion_created",
        "event_created",
        "rule_created",
        "alert_changed",
      ],
      alert_state: ["normal", "vigilance", "crise"],
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
      request_status: ["pending", "approved", "rejected", "adjourned"],
      request_type: ["entry", "exit", "pardon", "access", "promotion", "other"],
      vote_choice: ["pour", "contre", "abstention"],
    },
  },
} as const
