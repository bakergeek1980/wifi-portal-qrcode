import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client pour les opérations admin (avec service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Types pour TypeScript
export type Database = {
  public: {
    Tables: {
      wifi_users: {
        Row: {
          id: string;
          prenom: string;
          email: string;
          date_anniversaire: string | null;
          langue: string;
          adresse_mac: string | null;
          consentement: boolean;
          consentement_date: string | null;
          derniere_connexion: string | null;
          nombre_connexions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['wifi_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['wifi_users']['Insert']>;
      };
      wifi_codes: {
        Row: {
          id: string;
          code: string;
          actif: boolean;
          created_at: string;
          expires_at: string | null;
          used_count: number;
          max_uses: number | null;
          description: string | null;
        };
        Insert: Omit<Database['public']['Tables']['wifi_codes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['wifi_codes']['Insert']>;
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          date_connexion: string;
          date_expiration: string;
          duree_minutes: number;
          code_utilise: string;
          adresse_ip: string | null;
          user_agent: string | null;
          statut: string;
          created_at: string;
        };
      };
      custom_messages: {
        Row: {
          id: string;
          titre: string;
          message_fr: string;
          message_en: string | null;
          message_de: string | null;
          message_it: string | null;
          type_message: string;
          date_debut: string | null;
          date_fin: string | null;
          actif: boolean;
          cible_langue: string | null;
          priorite: number;
          created_at: string;
          updated_at: string;
        };
      };
      lotteries: {
        Row: {
          id: string;
          mois: string;
          annee: number;
          gagnant_id: string | null;
          lot: string;
          email_envoye: boolean;
          date_envoi_email: string | null;
          date_tirage: string;
          participants_count: number;
          created_at: string;
        };
      };
      app_config: {
        Row: {
          id: string;
          cle: string;
          valeur: string;
          type_valeur: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
      };
      rgpd_content: {
        Row: {
          id: string;
          content: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
    };
  };
};