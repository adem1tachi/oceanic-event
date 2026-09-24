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
      topics: {
        Row: {
          id: string;
          slug: string;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          topic_id: string;
          device_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          device_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          device_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
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
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          consent?: boolean;
          locale?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          consent?: boolean;
          locale?: string;
          created_at?: string;
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
    };
    Views: {
      vote_counts: {
        Row: {
          topic_id: string;
          topic_slug: string;
          topic_position: number;
          count: number;
        };
        Relationships: [];
      };
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
