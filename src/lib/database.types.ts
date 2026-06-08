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
      ai_issues: {
        Row: {
          action: string
          company_id: string
          created_at: string
          detail: string
          id: string
          loss_yen: number
          month: string
          priority: number
          rank: number
          title: string
        }
        Insert: {
          action?: string
          company_id: string
          created_at?: string
          detail?: string
          id?: string
          loss_yen?: number
          month: string
          priority?: number
          rank?: number
          title: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          detail?: string
          id?: string
          loss_yen?: number
          month?: string
          priority?: number
          rank?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_issues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          area: string
          competitor_area: string
          competitor_total: number
          created_at: string
          employees: number
          id: string
          industry: string
          is_sample: boolean
          name: string
          onboarded_at: string | null
          owner_id: string
          plan: string
          updated_at: string
          website_url: string
        }
        Insert: {
          area?: string
          competitor_area?: string
          competitor_total?: number
          created_at?: string
          employees?: number
          id?: string
          industry?: string
          is_sample?: boolean
          name?: string
          onboarded_at?: string | null
          owner_id: string
          plan?: string
          updated_at?: string
          website_url?: string
        }
        Update: {
          area?: string
          competitor_area?: string
          competitor_total?: number
          created_at?: string
          employees?: number
          id?: string
          industry?: string
          is_sample?: boolean
          name?: string
          onboarded_at?: string | null
          owner_id?: string
          plan?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      competitor_metrics: {
        Row: {
          company_id: string
          higher_is_better: boolean
          id: string
          industry_avg: number
          label: string
          ours_label: string
          ours_value: number
          rank_in_area: number
          sort: number
          status: string
          top_value: number
          total_in_area: number
          unit: string
        }
        Insert: {
          company_id: string
          higher_is_better?: boolean
          id?: string
          industry_avg?: number
          label: string
          ours_label?: string
          ours_value?: number
          rank_in_area?: number
          sort?: number
          status?: string
          top_value?: number
          total_in_area?: number
          unit?: string
        }
        Update: {
          company_id?: string
          higher_is_better?: boolean
          id?: string
          industry_avg?: number
          label?: string
          ours_label?: string
          ours_value?: number
          rank_in_area?: number
          sort?: number
          status?: string
          top_value?: number
          total_in_area?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          company_id: string
          config: Json
          id: string
          last_sync: string | null
          metrics: Json
          name: string
          sort: number
          source_key: string
          status: string
        }
        Insert: {
          company_id: string
          config?: Json
          id?: string
          last_sync?: string | null
          metrics?: Json
          name: string
          sort?: number
          source_key: string
          status?: string
        }
        Update: {
          company_id?: string
          config?: Json
          id?: string
          last_sync?: string | null
          metrics?: Json
          name?: string
          sort?: number
          source_key?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          company_id: string
          created_at: string
          cvr: number
          health_breakdown: Json
          health_score: number
          id: string
          ig_followers: number
          improvement_yen: number
          inquiries: number
          line_block_rate: number
          line_subscribers: number
          month: string
          profit: number
          reviews: number
          sales: number
          seo_rank: number
        }
        Insert: {
          company_id: string
          created_at?: string
          cvr?: number
          health_breakdown?: Json
          health_score?: number
          id?: string
          ig_followers?: number
          improvement_yen?: number
          inquiries?: number
          line_block_rate?: number
          line_subscribers?: number
          month: string
          profit?: number
          reviews?: number
          sales?: number
          seo_rank?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          cvr?: number
          health_breakdown?: Json
          health_score?: number
          id?: string
          ig_followers?: number
          improvement_yen?: number
          inquiries?: number
          line_block_rate?: number
          line_subscribers?: number
          month?: string
          profit?: number
          reviews?: number
          sales?: number
          seo_rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
