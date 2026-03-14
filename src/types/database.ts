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
      emails: {
        Row: {
          id: string;
          created_at: string;
          recipient: string;
          sender: string;
          subject: string | null;
          body_html: string | null;
          body_text: string | null;
          raw_content: string | null;
          is_otp: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          recipient: string;
          sender: string;
          subject?: string | null;
          body_html?: string | null;
          body_text?: string | null;
          raw_content?: string | null;
          is_otp?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          recipient?: string;
          sender?: string;
          subject?: string | null;
          body_html?: string | null;
          body_text?: string | null;
          raw_content?: string | null;
          is_otp?: boolean;
        };
        Relationships: [];
      };
      email_users: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          type: "manual" | "random";
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          type?: "manual" | "random";
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          type?: "manual" | "random";
        };
        Relationships: [];
      };
      admin_config: {
        Row: {
          id: string;
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Email = Database["public"]["Tables"]["emails"]["Row"];
export type InsertEmail = Database["public"]["Tables"]["emails"]["Insert"];
export type EmailUser = Database["public"]["Tables"]["email_users"]["Row"];
export type InsertEmailUser = Database["public"]["Tables"]["email_users"]["Insert"];
