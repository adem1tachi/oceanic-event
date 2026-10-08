export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number;
          is_registration_open: boolean;
          event_date: string | null;
          contact_statuses: Json;
        };
        Insert: {
          id?: number;
          is_registration_open?: boolean;
          event_date?: string | null;
          contact_statuses?: Json;
        };
        Update: {
          id?: number;
          is_registration_open?: boolean;
          event_date?: string | null;
          contact_statuses?: Json;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          consent: boolean;
          locale: string;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
          position: string | null;
          company: string | null;
          desired_topic: string | null;
          people_count: number | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          consent?: boolean;
          locale?: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          position?: string | null;
          company?: string | null;
          desired_topic?: string | null;
          people_count?: number | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          consent?: boolean;
          locale?: string;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          position?: string | null;
          company?: string | null;
          desired_topic?: string | null;
          people_count?: number | null;
        };
        Relationships: [];
      };
      winners: {
        Row: {
          id: string;
          participant_id: string;
          draw_round: number;
          drawn_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          draw_round?: number;
          drawn_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          draw_round?: number;
          drawn_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "winners_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: true;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      site_analytics: {
        Row: {
          id: string;
          event_type: string;
          visitor_id: string;
          session_id: string | null;
          url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          visitor_id: string;
          session_id?: string | null;
          url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          visitor_id?: string;
          session_id?: string | null;
          url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      draw_winners: {
        Args: {
          n: number;
        };
        Returns: {
          id: string;
          participant_id: string;
          full_name: string;
          phone: string;
          email: string | null;
          locale: string;
          draw_round: number;
          drawn_at: string;
        }[];
      };
      reset_draw: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
