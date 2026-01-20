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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      game_sessions: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          game_number: number | null
          id: string
          module_id: string
          part_number: number | null
          score_correct: number
          score_total: number
          started_at: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          game_number?: number | null
          id?: string
          module_id: string
          part_number?: number | null
          score_correct?: number
          score_total?: number
          started_at?: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          game_number?: number | null
          id?: string
          module_id?: string
          part_number?: number | null
          score_correct?: number
          score_total?: number
          started_at?: string
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_assignments: {
        Row: {
          assigned_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_onboarding_slides: {
        Row: {
          content: string
          created_at: string
          icon_name: string | null
          id: string
          image_url: string | null
          module_id: string
          slide_number: number
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          icon_name?: string | null
          id?: string
          image_url?: string | null
          module_id: string
          slide_number: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          icon_name?: string | null
          id?: string
          image_url?: string | null
          module_id?: string
          slide_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_onboarding_slides_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          game_type: string
          id: string
          is_active: boolean
          level: string | null
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_type?: string
          id?: string
          is_active?: boolean
          level?: string | null
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game_type?: string
          id?: string
          is_active?: boolean
          level?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pair_attempts: {
        Row: {
          attempts: number
          created_at: string
          game_session_id: string
          id: string
          time_taken_ms: number | null
          vocab_item_id: string
          was_correct: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          game_session_id: string
          id?: string
          time_taken_ms?: number | null
          vocab_item_id: string
          was_correct?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          game_session_id?: string
          id?: string
          time_taken_ms?: number | null
          vocab_item_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pair_attempts_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pair_attempts_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "vocab_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      session_answers: {
        Row: {
          answered_at: string
          game_session_id: string
          id: string
          vocab_item_id: string
          was_correct: boolean
        }
        Insert: {
          answered_at?: string
          game_session_id: string
          id?: string
          vocab_item_id: string
          was_correct: boolean
        }
        Update: {
          answered_at?: string
          game_session_id?: string
          id?: string
          vocab_item_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "session_answers_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_answers_vocab_item_id_fkey"
            columns: ["vocab_item_id"]
            isOneToOne: false
            referencedRelation: "vocab_items"
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
      vocab_items: {
        Row: {
          category: string | null
          correct_option: string | null
          created_at: string
          definition: string
          example: string | null
          id: string
          module_id: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          updated_at: string
          word: string
        }
        Insert: {
          category?: string | null
          correct_option?: string | null
          created_at?: string
          definition: string
          example?: string | null
          id?: string
          module_id: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          category?: string | null
          correct_option?: string | null
          created_at?: string
          definition?: string
          example?: string | null
          id?: string
          module_id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "pupil"
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
      app_role: ["admin", "pupil"],
    },
  },
} as const
