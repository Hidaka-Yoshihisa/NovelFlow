// types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      novels: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          synopsis: string | null;
          status: string;
          type: 'short' | 'regular' | string; // 'short' (ショート小説) or 'regular' (通常小説)
          category?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          synopsis?: string | null;
          status?: string;
          type?: 'short' | 'regular' | string;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          synopsis?: string | null;
          status?: string;
          type?: 'short' | 'regular' | string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      novel_pages: {
        Row: {
          id: string;
          novel_id: string;
          page_number: number;
          content: string;
          chapter_title?: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          novel_id: string;
          page_number: number;
          content: string;
          chapter_title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          novel_id?: string;
          page_number?: number;
          content?: string;
          chapter_title?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      interactions: {
        Row: {
          id: string;
          user_id: string;
          novel_id: string;
          interaction_type: string;
          max_page_read: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          novel_id: string;
          interaction_type: string;
          max_page_read: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          novel_id?: string;
          interaction_type?: string;
          max_page_read?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Novel = Database['public']['Tables']['novels']['Row'];
export type NovelPage = Database['public']['Tables']['novel_pages']['Row'];
export type Interaction = Database['public']['Tables']['interactions']['Row'];

/**
 * UI表示用に結合された小説データ構造
 */
export interface NovelWithDetails extends Novel {
  author?: Profile | null;
  pages: NovelPage[];
  likesCount?: number;
  commentsCount?: number;
  tipsTotal?: number; // 将来の投げ銭機能用
  isLiked?: boolean;
  isBookmarked?: boolean;
}
