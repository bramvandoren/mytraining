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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          created_at: string
          id: string
          marked_by: string
          note: string | null
          player_id: string
          scheduled_training_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          marked_by: string
          note?: string | null
          player_id: string
          scheduled_training_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          marked_by?: string
          note?: string | null
          player_id?: string
          scheduled_training_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_scheduled_training_id_fkey"
            columns: ["scheduled_training_id"]
            isOneToOne: false
            referencedRelation: "scheduled_trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      club_activity: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id: string | null
          club_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          club_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          club_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "club_activity_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          club_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["club_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["club_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          club_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["club_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_invitations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_media: {
        Row: {
          club_id: string
          created_at: string
          folder: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          tags: string[]
          uploaded_by: string
        }
        Insert: {
          club_id: string
          created_at?: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[]
          uploaded_by: string
        }
        Update: {
          club_id?: string
          created_at?: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_media_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          joined_at: string
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          id: string
          is_personal: boolean
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      custom_exercises: {
        Row: {
          age_groups: string[]
          club_id: string | null
          created_at: string
          description: string
          duration: number
          exercise_type: string
          field_diagram: Json | null
          field_size: string
          icon: string
          id: string
          is_predefined: boolean
          is_public: boolean
          players: number
          preview_image_url: string | null
          skill_level: string
          team_id: string | null
          title: string
          updated_at: string
          user_id: string | null
          video_url: string | null
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          age_groups?: string[]
          club_id?: string | null
          created_at?: string
          description?: string
          duration?: number
          exercise_type?: string
          field_diagram?: Json | null
          field_size?: string
          icon?: string
          id?: string
          is_predefined?: boolean
          is_public?: boolean
          players?: number
          preview_image_url?: string | null
          skill_level?: string
          team_id?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          age_groups?: string[]
          club_id?: string | null
          created_at?: string
          description?: string
          duration?: number
          exercise_type?: string
          field_diagram?: Json | null
          field_size?: string
          icon?: string
          id?: string
          is_predefined?: boolean
          is_public?: boolean
          players?: number
          preview_image_url?: string | null
          skill_level?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "custom_exercises_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_exercises_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_likes: {
        Row: {
          created_at: string
          exercise_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_likes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "custom_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_tags: {
        Row: {
          exercise_id: string
          tag_id: string
        }
        Insert: {
          exercise_id: string
          tag_id: string
        }
        Update: {
          exercise_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_tags_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "custom_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      player_team_assignments: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          player_id: string
          started_at: string
          team_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player_id: string
          started_at?: string
          team_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player_id?: string
          started_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_team_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          birth_date: string | null
          club_id: string
          created_at: string
          created_by: string
          emergency_contact: string | null
          first_name: string
          id: string
          jersey_number: number | null
          last_name: string
          medical_notes: string | null
          nationality: string | null
          notes: string | null
          parent_contact: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          preferred_foot: Database["public"]["Enums"]["player_foot"] | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          club_id: string
          created_at?: string
          created_by: string
          emergency_contact?: string | null
          first_name: string
          id?: string
          jersey_number?: number | null
          last_name: string
          medical_notes?: string | null
          nationality?: string | null
          notes?: string | null
          parent_contact?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["player_foot"] | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          club_id?: string
          created_at?: string
          created_by?: string
          emergency_contact?: string | null
          first_name?: string
          id?: string
          jersey_number?: number | null
          last_name?: string
          medical_notes?: string | null
          nationality?: string | null
          notes?: string | null
          parent_contact?: string | null
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["player_foot"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          locale?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          username?: string
        }
        Relationships: []
      }
      scheduled_trainings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          repeat_weekly: boolean
          scheduled_date: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          repeat_weekly?: boolean
          scheduled_date: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          repeat_weekly?: boolean
          scheduled_date?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_trainings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          club_id: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_category: string | null
          club_id: string
          color: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          season_id: string | null
          updated_at: string
        }
        Insert: {
          age_category?: string | null
          club_id: string
          color?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          season_id?: string | null
          updated_at?: string
        }
        Update: {
          age_category?: string | null
          club_id?: string
          color?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          season_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          age_group: string
          club_id: string | null
          created_at: string
          date: string
          exercises: Json
          id: string
          is_shared: boolean
          name: string
          share_token: string | null
          team_id: string | null
          total_duration: number
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          age_group?: string
          club_id?: string | null
          created_at?: string
          date?: string
          exercises?: Json
          id?: string
          is_shared?: boolean
          name: string
          share_token?: string | null
          team_id?: string | null
          total_duration?: number
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          age_group?: string
          club_id?: string | null
          created_at?: string
          date?: string
          exercises?: Json
          id?: string
          is_shared?: boolean
          name?: string
          share_token?: string | null
          team_id?: string | null
          total_duration?: number
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      training_templates: {
        Row: {
          club_id: string | null
          created_at: string
          exercises: Json
          id: string
          name: string
          team_id: string | null
          total_duration: number
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          exercises?: Json
          id?: string
          name: string
          team_id?: string | null
          total_duration?: number
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          club_id?: string | null
          created_at?: string
          exercises?: Json
          id?: string
          name?: string
          team_id?: string | null
          total_duration?: number
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "training_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_templates_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          created_at: string
          goals: string | null
          id: string
          season_id: string
          session_ids: string[]
          week_start: string
        }
        Insert: {
          created_at?: string
          goals?: string | null
          id?: string
          season_id: string
          session_ids?: string[]
          week_start: string
        }
        Update: {
          created_at?: string
          goals?: string | null
          id?: string
          season_id?: string
          session_ids?: string[]
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      players_view: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          birth_date: string | null
          club_id: string | null
          created_at: string | null
          created_by: string | null
          current_team_id: string | null
          emergency_contact: string | null
          first_name: string | null
          id: string | null
          jersey_number: number | null
          last_name: string | null
          medical_notes: string | null
          nationality: string | null
          notes: string | null
          parent_contact: string | null
          position: Database["public"]["Enums"]["player_position"] | null
          preferred_foot: Database["public"]["Enums"]["player_foot"] | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_team_id?: never
          emergency_contact?: never
          first_name?: string | null
          id?: string | null
          jersey_number?: number | null
          last_name?: string | null
          medical_notes?: never
          nationality?: string | null
          notes?: string | null
          parent_contact?: never
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["player_foot"] | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_team_id?: never
          emergency_contact?: never
          first_name?: string | null
          id?: string | null
          jersey_number?: number | null
          last_name?: string | null
          medical_notes?: never
          nationality?: string | null
          notes?: string | null
          parent_contact?: never
          position?: Database["public"]["Enums"]["player_position"] | null
          preferred_foot?: Database["public"]["Enums"]["player_foot"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string }
      can_create_in_club: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit_club: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      can_see_player_sensitive: {
        Args: { _player_id: string; _user_id: string }
        Returns: boolean
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          club_id: string
          club_name: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["club_role"]
        }[]
      }
      get_shared_session: {
        Args: { _token: string }
        Returns: {
          age_group: string
          created_at: string
          date: string
          exercises: Json
          id: string
          name: string
          total_duration: number
        }[]
      }
      has_club_role: {
        Args: {
          _club_id: string
          _role: Database["public"]["Enums"]["club_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_club_member: {
        Args: { _club_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_head_coach: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      user_club_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      activity_action:
        | "training_created"
        | "training_shared"
        | "training_scheduled"
        | "exercise_created"
        | "exercise_shared"
        | "template_created"
        | "template_updated"
        | "team_created"
        | "team_updated"
        | "team_deleted"
        | "coach_joined"
        | "coach_invited"
        | "coach_role_changed"
        | "coach_removed"
        | "media_uploaded"
        | "player_created"
        | "player_archived"
        | "player_transferred"
        | "attendance_recorded"
      attendance_status: "present" | "absent" | "injured" | "late" | "excused"
      club_role: "owner" | "admin" | "coach" | "assistant"
      content_visibility: "private" | "club" | "public" | "team"
      player_foot: "left" | "right" | "both"
      player_position: "gk" | "def" | "mid" | "fwd"
      team_member_role: "head_coach" | "assistant"
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
      activity_action: [
        "training_created",
        "training_shared",
        "training_scheduled",
        "exercise_created",
        "exercise_shared",
        "template_created",
        "template_updated",
        "team_created",
        "team_updated",
        "team_deleted",
        "coach_joined",
        "coach_invited",
        "coach_role_changed",
        "coach_removed",
        "media_uploaded",
        "player_created",
        "player_archived",
        "player_transferred",
        "attendance_recorded",
      ],
      attendance_status: ["present", "absent", "injured", "late", "excused"],
      club_role: ["owner", "admin", "coach", "assistant"],
      content_visibility: ["private", "club", "public", "team"],
      player_foot: ["left", "right", "both"],
      player_position: ["gk", "def", "mid", "fwd"],
      team_member_role: ["head_coach", "assistant"],
    },
  },
} as const
