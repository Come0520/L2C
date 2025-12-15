export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_cache: {
        Row: {
          cache_data: string
          cache_key: string
          cache_type: string
          created_at: string
          date_range: string | null
          expires_at: string
          id: number
          updated_at: string
        }
        Insert: {
          cache_data: string
          cache_key: string
          cache_type: string
          created_at?: string
          date_range?: string | null
          expires_at: string
          id?: number
          updated_at?: string
        }
        Update: {
          cache_data?: string
          cache_key?: string
          cache_type?: string
          created_at?: string
          date_range?: string | null
          expires_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      approval_actions: {
        Row: {
          action: string
          actor_id: string | null
          comment: string | null
          created_at: string
          id: string
          request_id: string
          step_order: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          request_id: string
          step_order: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          request_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          created_at: string
          current_approver_override_role: string | null
          current_approver_override_user_id: string | null
          current_step_order: number
          entity_id: string
          entity_type: string
          flow_id: string
          id: string
          requester_id: string
          status: string
          step_started_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_approver_override_role?: string | null
          current_approver_override_user_id?: string | null
          current_step_order?: number
          entity_id: string
          entity_type: string
          flow_id: string
          id?: string
          requester_id: string
          status?: string
          step_started_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_approver_override_role?: string | null
          current_approver_override_user_id?: string | null
          current_step_order?: number
          entity_id?: string
          entity_type?: string
          flow_id?: string
          id?: string
          requester_id?: string
          status?: string
          step_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_current_approver_override_user_id_fkey"
            columns: ["current_approver_override_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "approval_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approver_role: string | null
          approver_user_id: string | null
          created_at: string
          flow_id: string
          id: string
          is_final: boolean
          step_order: number
        }
        Insert: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          flow_id: string
          id?: string
          is_final?: boolean
          step_order: number
        }
        Update: {
          approver_role?: string | null
          approver_user_id?: string | null
          created_at?: string
          flow_id?: string
          id?: string
          is_final?: boolean
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "approval_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_timeout_config: {
        Row: {
          action: string
          created_at: string
          escalate_to_role: string | null
          escalate_to_user_id: string | null
          id: string
          step_id: string
          timeout_hours: number
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          escalate_to_role?: string | null
          escalate_to_user_id?: string | null
          id?: string
          step_id: string
          timeout_hours: number
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          escalate_to_role?: string | null
          escalate_to_user_id?: string | null
          id?: string
          step_id?: string
          timeout_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_timeout_config_escalate_to_user_id_fkey"
            columns: ["escalate_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_timeout_config_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: true
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          created_at: string
          id: string
          permission: string
          slide_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          slide_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          slide_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      gift_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gifts: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          points: number
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          points: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          points?: number
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gifts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gift_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_orders: {
        Row: {
          actual_date: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          installation_data: Json | null
          installation_no: string
          installation_photos: string[] | null
          installer_id: string | null
          remark: string | null
          sales_order_id: string
          scheduled_at: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          installation_data?: Json | null
          installation_no: string
          installation_photos?: string[] | null
          installer_id?: string | null
          remark?: string | null
          sales_order_id: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          installation_data?: Json | null
          installation_no?: string
          installation_photos?: string[] | null
          installer_id?: string | null
          remark?: string | null
          sales_order_id?: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installation_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_orders_installer_id_fkey"
            columns: ["installer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_approval_records: {
        Row: {
          approval_comment: string | null
          approval_date: string | null
          approval_status: string
          approval_type: string
          approver_id: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          approval_comment?: string | null
          approval_date?: string | null
          approval_status?: string
          approval_type: string
          approver_id: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          approval_comment?: string | null
          approval_date?: string | null
          approval_status?: string
          approval_type?: string
          approver_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_approval_records_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_approval_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assigned_by_id: string | null
          assigned_to_id: string
          assignment_method: string | null
          created_at: string
          id: string
          lead_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          assigned_by_id?: string | null
          assigned_to_id: string
          assignment_method?: string | null
          created_at?: string
          id?: string
          lead_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by_id?: string | null
          assigned_to_id?: string
          assignment_method?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_assigned_by_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_user_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attachment_records: {
        Row: {
          attachment_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          lead_id: string
          status: string
          uploaded_at: string
          uploaded_by_id: string
        }
        Insert: {
          attachment_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          lead_id: string
          status?: string
          uploaded_at?: string
          uploaded_by_id: string
        }
        Update: {
          attachment_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          lead_id?: string
          status?: string
          uploaded_at?: string
          uploaded_by_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attachment_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attachment_records_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_up_records: {
        Row: {
          appointment_time: string | null
          content: string
          created_at: string
          created_by_id: string
          follow_up_type: string
          id: string
          lead_id: string
          next_follow_up_time: string | null
          note: string | null
          result: string
        }
        Insert: {
          appointment_time?: string | null
          content: string
          created_at?: string
          created_by_id: string
          follow_up_type?: string
          id?: string
          lead_id: string
          next_follow_up_time?: string | null
          note?: string | null
          result?: string
        }
        Update: {
          appointment_time?: string | null
          content?: string
          created_at?: string
          created_by_id?: string
          follow_up_type?: string
          id?: string
          lead_id?: string
          next_follow_up_time?: string | null
          note?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_up_records_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_up_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          content: string
          created_at: string
          follow_up_date: string
          id: string
          lead_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          follow_up_date: string
          id?: string
          lead_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          follow_up_date?: string
          id?: string
          lead_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_followups: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_followups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_installation_records: {
        Row: {
          created_at: string
          id: string
          installation_date: string | null
          installation_order_id: string | null
          installation_photos: Json | null
          installation_report_url: string | null
          installation_result: Json | null
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          installation_date?: string | null
          installation_order_id?: string | null
          installation_photos?: Json | null
          installation_report_url?: string | null
          installation_result?: Json | null
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          installation_date?: string | null
          installation_order_id?: string | null
          installation_photos?: Json | null
          installation_report_url?: string | null
          installation_result?: Json | null
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_installation_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_measurement_records: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          measurement_date: string | null
          measurement_order_id: string | null
          measurement_photos: Json | null
          measurement_report_url: string | null
          measurement_result: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          measurement_date?: string | null
          measurement_order_id?: string | null
          measurement_photos?: Json | null
          measurement_report_url?: string | null
          measurement_result?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          measurement_date?: string | null
          measurement_order_id?: string | null
          measurement_photos?: Json | null
          measurement_report_url?: string | null
          measurement_result?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_measurement_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_merge_history: {
        Row: {
          duplicate_lead_ids: string[]
          id: string
          merged_at: string
          merged_by_id: string | null
          notes: string | null
          primary_lead_id: string
        }
        Insert: {
          duplicate_lead_ids: string[]
          id?: string
          merged_at?: string
          merged_by_id?: string | null
          notes?: string | null
          primary_lead_id: string
        }
        Update: {
          duplicate_lead_ids?: string[]
          id?: string
          merged_at?: string
          merged_by_id?: string | null
          notes?: string | null
          primary_lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_merge_history_merged_by_id_fkey"
            columns: ["merged_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_merge_history_primary_lead_id_fkey"
            columns: ["primary_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_quote_records: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          quote_details: Json
          quote_files: Json | null
          quote_id: string | null
          quote_number: string
          quote_total: number
          quote_version: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          quote_details: Json
          quote_files?: Json | null
          quote_id?: string | null
          quote_number: string
          quote_total?: number
          quote_version?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          quote_details?: Json
          quote_files?: Json | null
          quote_id?: string | null
          quote_number?: string
          quote_total?: number
          quote_version?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_quote_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lead_id: string
          removed_at: string | null
          removed_by_id: string | null
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id: string
          removed_at?: string | null
          removed_by_id?: string | null
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string
          removed_at?: string | null
          removed_by_id?: string | null
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_assignments_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_removed_by_id_fkey"
            columns: ["removed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_auto: boolean | null
          is_system: boolean | null
          name: string
          sort_order: number | null
          tag_category: string
          tag_type: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_auto?: boolean | null
          is_system?: boolean | null
          name: string
          sort_order?: number | null
          tag_category?: string
          tag_type?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_auto?: boolean | null
          is_system?: boolean | null
          name?: string
          sort_order?: number | null
          tag_category?: string
          tag_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          appointment_reminder: string | null
          appointment_time: string | null
          area_size: number | null
          assigned_to_id: string | null
          budget_max: number | null
          budget_min: number | null
          business_tags: string[] | null
          cancellation_reason: string | null
          construction_progress: string | null
          created_at: string
          created_by_id: string
          customer_level: string | null
          deleted_at: string | null
          designer_id: string | null
          email: string | null
          expected_check_in_date: string | null
          expected_installation_date: string | null
          expected_measurement_date: string | null
          expected_purchase_date: string | null
          financial_status: string | null
          id: string
          installation_completed: boolean | null
          is_cancelled: boolean | null
          is_paused: boolean | null
          last_status_change_at: string | null
          last_status_change_by_id: string | null
          lead_number: string | null
          measurement_completed: boolean | null
          name: string
          notes: string | null
          pause_reason: string | null
          phone: string
          project_address: string | null
          quote_versions: number | null
          requirements: string[] | null
          shopping_guide_id: string | null
          source: string
          status: string
          total_quote_amount: number | null
          updated_at: string
        }
        Insert: {
          appointment_reminder?: string | null
          appointment_time?: string | null
          area_size?: number | null
          assigned_to_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_tags?: string[] | null
          cancellation_reason?: string | null
          construction_progress?: string | null
          created_at?: string
          created_by_id: string
          customer_level?: string | null
          deleted_at?: string | null
          designer_id?: string | null
          email?: string | null
          expected_check_in_date?: string | null
          expected_installation_date?: string | null
          expected_measurement_date?: string | null
          expected_purchase_date?: string | null
          financial_status?: string | null
          id?: string
          installation_completed?: boolean | null
          is_cancelled?: boolean | null
          is_paused?: boolean | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_number?: string | null
          measurement_completed?: boolean | null
          name: string
          notes?: string | null
          pause_reason?: string | null
          phone: string
          project_address?: string | null
          quote_versions?: number | null
          requirements?: string[] | null
          shopping_guide_id?: string | null
          source: string
          status: string
          total_quote_amount?: number | null
          updated_at?: string
        }
        Update: {
          appointment_reminder?: string | null
          appointment_time?: string | null
          area_size?: number | null
          assigned_to_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_tags?: string[] | null
          cancellation_reason?: string | null
          construction_progress?: string | null
          created_at?: string
          created_by_id?: string
          customer_level?: string | null
          deleted_at?: string | null
          designer_id?: string | null
          email?: string | null
          expected_check_in_date?: string | null
          expected_installation_date?: string | null
          expected_measurement_date?: string | null
          expected_purchase_date?: string | null
          financial_status?: string | null
          id?: string
          installation_completed?: boolean | null
          is_cancelled?: boolean | null
          is_paused?: boolean | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_number?: string | null
          measurement_completed?: boolean | null
          name?: string
          notes?: string | null
          pause_reason?: string | null
          phone?: string
          project_address?: string | null
          quote_versions?: number | null
          requirements?: string[] | null
          shopping_guide_id?: string | null
          source?: string
          status?: string
          total_quote_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_last_status_change_by_id_fkey"
            columns: ["last_status_change_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_shopping_guide_id_fkey"
            columns: ["shopping_guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mall_orders: {
        Row: {
          contact_phone: string | null
          created_at: string
          id: string
          points_spent: number
          product_id: string
          product_name: string
          remark: string | null
          shipping_address: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          points_spent: number
          product_id: string
          product_name: string
          remark?: string | null
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          points_spent?: number
          product_id?: string
          product_name?: string
          remark?: string | null
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mall_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mall_products"
            referencedColumns: ["id"]
          },
        ]
      }
      mall_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          points_required: number
          sort_order: number | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          points_required: number
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          points_required?: number
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      measurement_orders: {
        Row: {
          actual_date: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          measurement_data: Json | null
          measurement_no: string
          measurement_photos: string[] | null
          measurement_report_url: string | null
          measurer_id: string | null
          quote_version_id: string | null
          remark: string | null
          remarks: string | null
          sales_order_id: string
          scheduled_at: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          measurement_data?: Json | null
          measurement_no: string
          measurement_photos?: string[] | null
          measurement_report_url?: string | null
          measurer_id?: string | null
          quote_version_id?: string | null
          remark?: string | null
          remarks?: string | null
          sales_order_id: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          measurement_data?: Json | null
          measurement_no?: string
          measurement_photos?: string[] | null
          measurement_report_url?: string | null
          measurer_id?: string | null
          quote_version_id?: string | null
          remark?: string | null
          remarks?: string | null
          sales_order_id?: string
          scheduled_at?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_orders_measurer_id_fkey"
            columns: ["measurer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_orders_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      measurers: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_assignment_history: {
        Row: {
          assigned_at: string
          assigned_by_id: string
          assignment_type: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_assignee_id: string
          old_assignee_id: string | null
          order_id: string
          reason: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_id: string
          assignment_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_assignee_id: string
          old_assignee_id?: string | null
          order_id: string
          reason?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_id?: string
          assignment_type?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_assignee_id?: string
          old_assignee_id?: string | null
          order_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_assignment_history_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_assignment_history_new_assignee_id_fkey"
            columns: ["new_assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_assignment_history_old_assignee_id_fkey"
            columns: ["old_assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_assignment_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_logs: {
        Row: {
          changed_at: string
          changed_by: string
          comment: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          comment?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          comment?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_transitions: {
        Row: {
          changed_at: string
          changed_by_id: string | null
          comment: string | null
          created_at: string
          from_status: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          order_id: string
          reason_category: string | null
          to_status: string
          transition_duration_seconds: number | null
          user_agent: string | null
        }
        Insert: {
          changed_at?: string
          changed_by_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          order_id: string
          reason_category?: string | null
          to_status: string
          transition_duration_seconds?: number | null
          user_agent?: string | null
        }
        Update: {
          changed_at?: string
          changed_by_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          order_id?: string
          reason_category?: string | null
          to_status?: string
          transition_duration_seconds?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_transitions_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_transitions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_statuses: {
        Row: {
          created_at: string
          description: string | null
          id: number
          phase: string
          sequence: number
          status_code: string
          status_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          phase: string
          sequence: number
          status_code: string
          status_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          phase?: string
          sequence?: number
          status_code?: string
          status_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          last_status_change_at: string | null
          last_status_change_by_id: string | null
          order_no: string
          sales_id: string
          sales_no: string
          status: string
          total_amount: number
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          order_no: string
          sales_id: string
          sales_no: string
          status: string
          total_amount: number
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          order_no?: string
          sales_id?: string
          sales_no?: string
          status?: string
          total_amount?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_last_status_change_by_id_fkey"
            columns: ["last_status_change_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_items: {
        Row: {
          base_price: number
          created_at: string
          id: string
          package_id: string
          quota: number
          type: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          package_id: string
          quota?: number
          type: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          package_id?: string
          quota?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_package_items_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          created_at: string
          id: number
          name: string
          partner_id: string
          partner_level: string
          partner_type: string
          phone: string | null
          store_id: string | null
          store_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          partner_id: string
          partner_level: string
          partner_type: string
          phone?: string | null
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          partner_id?: string
          partner_level?: string
          partner_type?: string
          phone?: string | null
          store_id?: string | null
          store_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      point_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points_accounts: {
        Row: {
          available_points: number
          created_at: string
          frozen_points: number
          id: string
          pending_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          frozen_points?: number
          id?: string
          pending_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          frozen_points?: number
          id?: string
          pending_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_coefficient_approvals: {
        Row: {
          approval_no: string
          channel_approval_comment: string | null
          channel_approval_status: string | null
          channel_approved_at: string | null
          channel_approver_id: string | null
          created_at: string
          final_approved_at: string | null
          final_status: string | null
          id: string
          leader_approval_comment: string | null
          leader_approval_status: string | null
          leader_approved_at: string | null
          leader_approver_id: string | null
          reason: string
          rule_ids: string[]
          status: string
          submitted_at: string
          submitted_by: string
          submitted_by_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_no: string
          channel_approval_comment?: string | null
          channel_approval_status?: string | null
          channel_approved_at?: string | null
          channel_approver_id?: string | null
          created_at?: string
          final_approved_at?: string | null
          final_status?: string | null
          id?: string
          leader_approval_comment?: string | null
          leader_approval_status?: string | null
          leader_approved_at?: string | null
          leader_approver_id?: string | null
          reason: string
          rule_ids: string[]
          status?: string
          submitted_at?: string
          submitted_by: string
          submitted_by_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approval_no?: string
          channel_approval_comment?: string | null
          channel_approval_status?: string | null
          channel_approved_at?: string | null
          channel_approver_id?: string | null
          created_at?: string
          final_approved_at?: string | null
          final_status?: string | null
          id?: string
          leader_approval_comment?: string | null
          leader_approval_status?: string | null
          leader_approved_at?: string | null
          leader_approver_id?: string | null
          reason?: string
          rule_ids?: string[]
          status?: string
          submitted_at?: string
          submitted_by?: string
          submitted_by_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_coefficient_rules: {
        Row: {
          approval_id: string | null
          approved_at: string | null
          approved_by: string | null
          base_coefficient: number
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          final_coefficient: number | null
          id: string
          product_category: string | null
          product_model: string | null
          region_code: string | null
          rule_code: string
          rule_name: string
          start_time: string
          status: string
          store_id: string | null
          time_coefficient: number
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          base_coefficient?: number
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          final_coefficient?: number | null
          id?: string
          product_category?: string | null
          product_model?: string | null
          region_code?: string | null
          rule_code: string
          rule_name: string
          start_time: string
          status?: string
          store_id?: string | null
          time_coefficient?: number
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          base_coefficient?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          final_coefficient?: number | null
          id?: string
          product_category?: string | null
          product_model?: string | null
          region_code?: string | null
          rule_code?: string
          rule_name?: string
          start_time?: string
          status?: string
          store_id?: string | null
          time_coefficient?: number
          updated_at?: string
        }
        Relationships: []
      }
      points_rules: {
        Row: {
          code: string
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean
          name: string
          start_time: string | null
          type: Database["public"]["Enums"]["points_rule_type"]
          updated_at: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name: string
          start_time?: string | null
          type: Database["public"]["Enums"]["points_rule_type"]
          updated_at?: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_time?: string | null
          type?: Database["public"]["Enums"]["points_rule_type"]
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          description: string | null
          id: string
          source_id: string | null
          source_type: string
          type: Database["public"]["Enums"]["points_transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          type: Database["public"]["Enums"]["points_transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          type?: Database["public"]["Enums"]["points_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "points_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          product_code: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          product_code: string
          status: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          product_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          height: number | null
          id: string
          image_url: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          quote_id: string
          quote_version_id: string
          space: string | null
          total_price: number
          unit: string | null
          unit_price: number
          updated_at: string | null
          variant_id: string | null
          width: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity: number
          quote_id: string
          quote_version_id: string
          space?: string | null
          total_price: number
          unit?: string | null
          unit_price: number
          updated_at?: string | null
          variant_id?: string | null
          width?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          quote_id?: string
          quote_version_id?: string
          space?: string | null
          total_price?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          variant_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quote_items_quote"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          quote_id: string
          quote_no: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          quote_id: string
          quote_no?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          version: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          quote_id?: string
          quote_no?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_quote_versions_quote"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          current_version: number | null
          current_version_id: string | null
          customer_id: string | null
          id: string
          lead_id: string | null
          project_address: string | null
          project_name: string | null
          quote_no: string | null
          salesperson_id: string | null
          status: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_version?: number | null
          current_version_id?: string | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          project_address?: string | null
          project_name?: string | null
          quote_no?: string | null
          salesperson_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_version?: number | null
          current_version_id?: string | null
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          project_address?: string | null
          project_name?: string | null
          quote_no?: string | null
          salesperson_id?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_orders: {
        Row: {
          balance_amount: number
          created_at: string
          id: string
          invoice_no: string | null
          paid_amount: number
          reconciliation_no: string
          remark: string | null
          sales_order_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_amount?: number
          created_at?: string
          id?: string
          invoice_no?: string | null
          paid_amount?: number
          reconciliation_no: string
          remark?: string | null
          sales_order_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          created_at?: string
          id?: string
          invoice_no?: string | null
          paid_amount?: number
          reconciliation_no?: string
          remark?: string | null
          sales_order_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          content: string
          created_at: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_amounts: {
        Row: {
          background_wall_subtotal: number
          created_at: string
          curtain_subtotal: number
          id: string
          package_amount: number
          package_excess_amount: number
          sales_order_id: string
          standard_product_subtotal: number
          total_amount: number
          updated_at: string
          upgrade_amount: number
          wallcovering_subtotal: number
          window_cushion_subtotal: number
        }
        Insert: {
          background_wall_subtotal?: number
          created_at?: string
          curtain_subtotal?: number
          id?: string
          package_amount?: number
          package_excess_amount?: number
          sales_order_id: string
          standard_product_subtotal?: number
          total_amount?: number
          updated_at?: string
          upgrade_amount?: number
          wallcovering_subtotal?: number
          window_cushion_subtotal?: number
        }
        Update: {
          background_wall_subtotal?: number
          created_at?: string
          curtain_subtotal?: number
          id?: string
          package_amount?: number
          package_excess_amount?: number
          sales_order_id?: string
          standard_product_subtotal?: number
          total_amount?: number
          updated_at?: string
          upgrade_amount?: number
          wallcovering_subtotal?: number
          window_cushion_subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_amounts_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: true
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          amount: number
          category: string
          created_at: string
          difference_amount: number
          height: number
          id: string
          image_url: string | null
          is_package_item: boolean
          package_tag: string | null
          package_type: string | null
          price_difference: number
          product: string
          quantity: number
          remark: string | null
          sales_order_id: string
          space: string
          unit: string
          unit_price: number
          updated_at: string
          usage_amount: number
          width: number
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          difference_amount?: number
          height?: number
          id?: string
          image_url?: string | null
          is_package_item?: boolean
          package_tag?: string | null
          package_type?: string | null
          price_difference?: number
          product: string
          quantity?: number
          remark?: string | null
          sales_order_id: string
          space: string
          unit?: string
          unit_price?: number
          updated_at?: string
          usage_amount?: number
          width?: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          difference_amount?: number
          height?: number
          id?: string
          image_url?: string | null
          is_package_item?: boolean
          package_tag?: string | null
          package_type?: string | null
          price_difference?: number
          product?: string
          quantity?: number
          remark?: string | null
          sales_order_id?: string
          space?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          usage_amount?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_packages: {
        Row: {
          created_at: string
          id: string
          package_id: string
          sales_order_id: string
          space: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          sales_order_id: string
          space: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          sales_order_id?: string
          space?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_order_packages_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_packages_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_partners: {
        Row: {
          commission_amount: number | null
          commission_rate: number | null
          created_at: string
          id: number
          partner_id: string
          partner_type: string
          sales_order_id: string
        }
        Insert: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: number
          partner_id: string
          partner_type: string
          sales_order_id: string
        }
        Update: {
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string
          id?: number
          partner_id?: string
          partner_type?: string
          sales_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "sales_order_partners_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_status_history: {
        Row: {
          change_reason: string | null
          changed_by_user_id: string
          created_at: string
          from_status: string
          id: number
          sales_order_id: string
          to_status: string
        }
        Insert: {
          change_reason?: string | null
          changed_by_user_id: string
          created_at?: string
          from_status: string
          id?: number
          sales_order_id: string
          to_status: string
        }
        Update: {
          change_reason?: string | null
          changed_by_user_id?: string
          created_at?: string
          from_status?: string
          id?: number
          sales_order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_status_history_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_status_transitions: {
        Row: {
          attached_files: Json | null
          changed_at: string
          changed_by_id: string
          comment: string | null
          created_at: string
          from_status: string | null
          id: string
          metadata: Json | null
          required_fields_met: boolean | null
          sales_order_id: string
          to_status: string
        }
        Insert: {
          attached_files?: Json | null
          changed_at?: string
          changed_by_id: string
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          required_fields_met?: boolean | null
          sales_order_id: string
          to_status: string
        }
        Update: {
          attached_files?: Json | null
          changed_at?: string
          changed_by_id?: string
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          required_fields_met?: boolean | null
          sales_order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_status_transitions_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_status_transitions_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          abnormal_at: string | null
          abnormal_reason: string | null
          all_production_completed_at: string | null
          budget_quote_file_url: string | null
          budget_quote_uploaded_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by_id: string | null
          create_time: string
          created_at: string
          customer_id: string
          designer: string | null
          designer_id: string | null
          designer_name: string | null
          designer_points: number | null
          expected_delivery_time: string | null
          guide_id: string | null
          guide_points: number | null
          id: string
          installation_confirmed_at: string | null
          installation_confirmed_by_id: string | null
          installation_notes: string | null
          installation_photo_urls: Json | null
          invoice_file_url: string | null
          invoice_issued_at: string | null
          invoice_issued_by_id: string | null
          invoice_no: string | null
          is_abnormal: boolean | null
          is_cancelled: boolean | null
          is_paused: boolean | null
          last_status_change_at: string | null
          last_status_change_by_id: string | null
          lead_id: string
          order_no: string
          pause_reason: string | null
          paused_at: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by_id: string | null
          payment_proof_urls: Json | null
          plan_confirmed_at: string | null
          plan_confirmed_by_id: string | null
          plan_confirmed_photo_urls: Json | null
          points_settled: boolean | null
          production_notes: string | null
          production_order_nos: Json | null
          project_address: string | null
          push_order_confirmed_at: string | null
          push_order_confirmed_by_id: string | null
          push_order_confirmed_by_user_id: string | null
          push_order_screenshot_url: string | null
          push_order_uploaded_at: string | null
          quote_status: string | null
          sales_id: string | null
          sales_no: string
          sales_person: string | null
          sales_person_name: string | null
          source_quote_id: string | null
          status: string
          status_change_comment: string | null
          updated_at: string
        }
        Insert: {
          abnormal_at?: string | null
          abnormal_reason?: string | null
          all_production_completed_at?: string | null
          budget_quote_file_url?: string | null
          budget_quote_uploaded_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_id?: string | null
          create_time: string
          created_at?: string
          customer_id: string
          designer?: string | null
          designer_id?: string | null
          designer_name?: string | null
          designer_points?: number | null
          expected_delivery_time?: string | null
          guide_id?: string | null
          guide_points?: number | null
          id?: string
          installation_confirmed_at?: string | null
          installation_confirmed_by_id?: string | null
          installation_notes?: string | null
          installation_photo_urls?: Json | null
          invoice_file_url?: string | null
          invoice_issued_at?: string | null
          invoice_issued_by_id?: string | null
          invoice_no?: string | null
          is_abnormal?: boolean | null
          is_cancelled?: boolean | null
          is_paused?: boolean | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_id: string
          order_no: string
          pause_reason?: string | null
          paused_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_id?: string | null
          payment_proof_urls?: Json | null
          plan_confirmed_at?: string | null
          plan_confirmed_by_id?: string | null
          plan_confirmed_photo_urls?: Json | null
          points_settled?: boolean | null
          production_notes?: string | null
          production_order_nos?: Json | null
          project_address?: string | null
          push_order_confirmed_at?: string | null
          push_order_confirmed_by_id?: string | null
          push_order_confirmed_by_user_id?: string | null
          push_order_screenshot_url?: string | null
          push_order_uploaded_at?: string | null
          quote_status?: string | null
          sales_id?: string | null
          sales_no: string
          sales_person?: string | null
          sales_person_name?: string | null
          source_quote_id?: string | null
          status?: string
          status_change_comment?: string | null
          updated_at?: string
        }
        Update: {
          abnormal_at?: string | null
          abnormal_reason?: string | null
          all_production_completed_at?: string | null
          budget_quote_file_url?: string | null
          budget_quote_uploaded_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by_id?: string | null
          create_time?: string
          created_at?: string
          customer_id?: string
          designer?: string | null
          designer_id?: string | null
          designer_name?: string | null
          designer_points?: number | null
          expected_delivery_time?: string | null
          guide_id?: string | null
          guide_points?: number | null
          id?: string
          installation_confirmed_at?: string | null
          installation_confirmed_by_id?: string | null
          installation_notes?: string | null
          installation_photo_urls?: Json | null
          invoice_file_url?: string | null
          invoice_issued_at?: string | null
          invoice_issued_by_id?: string | null
          invoice_no?: string | null
          is_abnormal?: boolean | null
          is_cancelled?: boolean | null
          is_paused?: boolean | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_id?: string
          order_no?: string
          pause_reason?: string | null
          paused_at?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by_id?: string | null
          payment_proof_urls?: Json | null
          plan_confirmed_at?: string | null
          plan_confirmed_by_id?: string | null
          plan_confirmed_photo_urls?: Json | null
          points_settled?: boolean | null
          production_notes?: string | null
          production_order_nos?: Json | null
          project_address?: string | null
          push_order_confirmed_at?: string | null
          push_order_confirmed_by_id?: string | null
          push_order_confirmed_by_user_id?: string | null
          push_order_screenshot_url?: string | null
          push_order_uploaded_at?: string | null
          quote_status?: string | null
          sales_id?: string | null
          sales_no?: string
          sales_person?: string | null
          sales_person_name?: string | null
          source_quote_id?: string | null
          status?: string
          status_change_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_cancelled_by_id_fkey"
            columns: ["cancelled_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_installation_confirmed_by_id_fkey"
            columns: ["installation_confirmed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_invoice_issued_by_id_fkey"
            columns: ["invoice_issued_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_last_status_change_by_id_fkey"
            columns: ["last_status_change_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_payment_confirmed_by_id_fkey"
            columns: ["payment_confirmed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_plan_confirmed_by_id_fkey"
            columns: ["plan_confirmed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_push_order_confirmed_by_id_fkey"
            columns: ["push_order_confirmed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_sales_id_fkey"
            columns: ["sales_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          resource_id: string
          resource_type: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          is_active?: boolean
          resource_id: string
          resource_type: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          resource_id?: string
          resource_type?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_elements: {
        Row: {
          created_at: string
          element_type: string
          height: number
          id: string
          position_x: number
          position_y: number
          properties: Json
          slide_id: string
          width: number
          z_index: number
        }
        Insert: {
          created_at?: string
          element_type: string
          height: number
          id?: string
          position_x: number
          position_y: number
          properties: Json
          slide_id: string
          width: number
          z_index?: number
        }
        Update: {
          created_at?: string
          element_type?: string
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          properties?: Json
          slide_id?: string
          width?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "slide_elements_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "slides"
            referencedColumns: ["id"]
          },
        ]
      }
      slides: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          attached_files: Json | null
          changed_at: string
          changed_by_id: string
          comment: string | null
          id: string
          new_status: string
          old_status: string | null
          record_id: string
          record_type: string
          required_attachments: Json | null
        }
        Insert: {
          attached_files?: Json | null
          changed_at?: string
          changed_by_id: string
          comment?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          record_id: string
          record_type: string
          required_attachments?: Json | null
        }
        Update: {
          attached_files?: Json | null
          changed_at?: string
          changed_by_id?: string
          comment?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          record_id?: string
          record_type?: string
          required_attachments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "status_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
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
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          password: string | null
          permissions: Json | null
          phone: string
          profile: Json | null
          real_name: string | null
          role: string
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          password?: string | null
          permissions?: Json | null
          phone: string
          profile?: Json | null
          real_name?: string | null
          role?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          password?: string | null
          permissions?: Json | null
          phone?: string
          profile?: Json | null
          real_name?: string | null
          role?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      warnings: {
        Row: {
          action_required: string
          created_at: string | null
          id: string
          lead_id: string | null
          message: string
          metadata: Json | null
          order_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          type: string
        }
        Insert: {
          action_required: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message: string
          metadata?: Json | null
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          type: string
        }
        Update: {
          action_required?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warnings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          category: string
          code: string
          color: string
          created_at: string | null
          description: string | null
          is_system: boolean | null
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          color: string
          created_at?: string | null
          description?: string | null
          is_system?: boolean | null
          name: string
          order_index: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          color?: string
          created_at?: string | null
          description?: string | null
          is_system?: boolean | null
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_transition_rules: {
        Row: {
          created_at: string | null
          from_status: string | null
          id: string
          required_fields: string[] | null
          required_files: string[] | null
          required_permissions: string[] | null
          to_status: string | null
        }
        Insert: {
          created_at?: string | null
          from_status?: string | null
          id?: string
          required_fields?: string[] | null
          required_files?: string[] | null
          required_permissions?: string[] | null
          to_status?: string | null
        }
        Update: {
          created_at?: string | null
          from_status?: string | null
          id?: string
          required_fields?: string[] | null
          required_files?: string[] | null
          required_permissions?: string[] | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transition_rules_from_status_fkey"
            columns: ["from_status"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "workflow_transition_rules_to_status_fkey"
            columns: ["to_status"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      v_order_audit_log: {
        Row: {
          audit_id: string | null
          changed_at: string | null
          changed_by_email: string | null
          changed_by_id: string | null
          changed_by_name: string | null
          comment: string | null
          customer_name: string | null
          from_status: string | null
          from_status_name: string | null
          ip_address: unknown
          metadata: Json | null
          order_id: string | null
          order_no: string | null
          reason_category: string | null
          to_status: string | null
          to_status_name: string | null
          transition_duration_seconds: number | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_transitions_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_transitions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_sales_order_log: {
        Args: { p_action: string; p_details?: Json; p_order_id: string }
        Returns: undefined
      }
      assign_lead: {
        Args: { p_assignee_id: string; p_lead_id: string; p_reason?: string }
        Returns: undefined
      }
      assign_tag_to_lead: {
        Args: { p_assigned_by_id: string; p_lead_id: string; p_tag_id: string }
        Returns: boolean
      }
      batch_assign_sales_person: {
        Args: {
          p_assigned_by_id: string
          p_order_ids: string[]
          p_reason?: string
          p_sales_person_id: string
        }
        Returns: Json
      }
      batch_update_order_status: {
        Args: { p_new_status: string; p_order_ids: string[] }
        Returns: number
      }
      batch_update_order_status_v2: {
        Args: {
          p_changed_by_id?: string
          p_new_status: string
          p_order_ids: string[]
          p_skip_validation?: boolean
        }
        Returns: Json
      }
      batch_update_sales_order_status: {
        Args: { p_new_status: string; p_order_ids: string[] }
        Returns: number
      }
      calculate_points: {
        Args: { p_base_amount?: number; p_rule_code: string }
        Returns: number
      }
      cancel_order: {
        Args: {
          p_cancellation_reason: string
          p_cancelled_by_id: string
          p_order_id: string
        }
        Returns: Json
      }
      confirm_pending_points: {
        Args: {
          p_amount: number
          p_description?: string
          p_source_id: string
          p_user_id: string
        }
        Returns: string
      }
      create_mall_order: {
        Args: {
          p_contact_phone: string
          p_product_id: string
          p_remark?: string
          p_shipping_address: string
        }
        Returns: string
      }
      create_order: { Args: { order_data: Json }; Returns: string }
      create_sales_order:
        | {
            Args: {
              p_amounts: Json
              p_customer_info: Json
              p_items: Json[]
              p_lead_id: string
              p_order_info: Json
              p_packages: Json
            }
            Returns: string
          }
        | {
            Args: {
              p_amounts: Json
              p_customer_info: Json
              p_items: Json
              p_lead_id: string
              p_order_info: Json
              p_packages: Json
            }
            Returns: string
          }
      delete_order: { Args: { p_order_id: string }; Returns: undefined }
      delete_sales_order: { Args: { p_order_id: string }; Returns: undefined }
      find_duplicate_leads_by_phone: {
        Args: { p_limit?: number }
        Returns: {
          latest_created_at: string
          lead_count: number
          lead_details: Json
          lead_ids: string[]
          phone: string
        }[]
      }
      full_update_sales_order: {
        Args: {
          p_amounts: Json
          p_customer_info: Json
          p_items: Json[]
          p_order_id: string
          p_order_info: Json
        }
        Returns: undefined
      }
      generate_sales_no: { Args: never; Returns: string }
      get_allowed_next_statuses: {
        Args: { p_current_status: string }
        Returns: string[]
      }
      get_batch_order_status_history: {
        Args: { p_order_ids: string[]; p_status_filter?: string }
        Returns: {
          changed_at: string
          changed_by_name: string
          duration_seconds: number
          from_status: string
          order_id: string
          order_no: string
          to_status: string
          to_status_name: string
          transition_id: string
        }[]
      }
      get_lead_status_history: {
        Args: { lead_id: string }
        Returns: {
          attached_files: Json
          changed_at: string
          changed_by_name: string
          comment: string
          new_status: string
          old_status: string
          required_attachments: Json
          status_change_id: string
        }[]
      }
      get_lead_tags: {
        Args: { p_lead_id: string }
        Returns: {
          assigned_at: string
          assigned_by_name: string
          is_auto: boolean
          is_system: boolean
          tag_category: string
          tag_color: string
          tag_id: string
          tag_name: string
          tag_type: string
        }[]
      }
      get_lead_warnings: { Args: never; Returns: Json }
      get_order_assignment_history: {
        Args: { p_order_id: string }
        Returns: {
          assigned_at: string
          assigned_by_name: string
          assignment_id: string
          assignment_type: string
          new_assignee_name: string
          old_assignee_name: string
          reason: string
        }[]
      }
      get_order_status_history: {
        Args: { p_order_id: string }
        Returns: {
          changed_at: string
          changed_by_name: string
          comment: string
          from_status: string
          to_status: string
          transition_id: string
        }[]
      }
      get_order_status_history_enhanced: {
        Args: { p_limit?: number; p_offset?: number; p_order_id: number }
        Returns: {
          changed_at: string
          changed_by_id: string
          changed_by_name: string
          comment: string
          duration_display: string
          duration_seconds: number
          from_status: string
          from_status_name: string
          metadata: Json
          reason_category: string
          to_status: string
          to_status_name: string
          transition_id: string
        }[]
      }
      get_order_status_statistics: {
        Args: { p_order_id: number }
        Returns: {
          avg_transition_duration_seconds: number
          current_status: string
          current_status_duration_seconds: number
          exception_count: number
          manual_changes: number
          system_changes: number
          total_duration_seconds: number
          total_transitions: number
        }[]
      }
      get_order_status_timeline: {
        Args: { p_order_id: number }
        Returns: {
          changed_by_name: string
          duration_seconds: number
          entered_at: string
          exited_at: string
          status: string
          status_color: string
          status_name: string
        }[]
      }
      get_sales_order_details: {
        Args: { p_order_id: string }
        Returns: {
          amounts: Json
          create_time: string
          customer_id: string
          designer: string
          expected_delivery_time: string
          id: string
          items: Json[]
          lead_id: string
          packages: Json
          project_address: string
          sales_no: string
          sales_person: string
          status: string
        }[]
      }
      get_sales_order_status_history: {
        Args: { p_order_id: string }
        Returns: {
          changed_by_user_id: string
          created_at: string
          from_status: string
          to_status: string
        }[]
      }
      get_sales_person_assignment_stats: {
        Args: {
          p_end_date?: string
          p_sales_person_id: string
          p_start_date?: string
        }
        Returns: {
          assignments_as_new: number
          assignments_as_old: number
          avg_hold_duration_hours: number
          total_assignments: number
        }[]
      }
      get_warning_leads: {
        Args: { p_limit?: number; p_warning_type?: string }
        Returns: {
          customer_name: string
          days_overdue: number
          last_update: string
          lead_id: string
          lead_number: string
          phone: string
          status: string
          warning_details: Json
          warning_type: string
        }[]
      }
      get_warning_stats: {
        Args: never
        Returns: {
          count: number
          severity: string
          type: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_valid_status_transition: {
        Args: { p_from_status: string; p_to_status: string }
        Returns: boolean
      }
      maintain_lead_auto_tags: { Args: never; Returns: undefined }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      merge_leads: {
        Args: {
          p_duplicate_ids: string[]
          p_merged_by_id: string
          p_notes?: string
          p_primary_id: string
        }
        Returns: Json
      }
      points_to_pending: {
        Args: {
          p_amount: number
          p_description: string
          p_source_id: string
          p_user_id: string
        }
        Returns: string
      }
      process_approval_timeouts: { Args: never; Returns: Json }
      process_points_transaction: {
        Args: {
          p_amount: number
          p_description: string
          p_source_id: string
          p_source_type: string
          p_type: Database["public"]["Enums"]["points_transaction_type"]
          p_user_id: string
        }
        Returns: string
      }
      remove_tag_from_lead: {
        Args: { p_lead_id: string; p_removed_by_id: string; p_tag_id: string }
        Returns: boolean
      }
      resolve_warning: { Args: { warning_id: string }; Returns: undefined }
      set_audit_context: { Args: { p_user_id: string }; Returns: undefined }
      update_order: {
        Args: { order_data: Json; p_order_id: string }
        Returns: undefined
      }
      update_order_status: {
        Args: {
          p_changed_by_id: string
          p_new_status: string
          p_order_id: string
        }
        Returns: undefined
      }
      update_order_status_v2: {
        Args: {
          p_changed_by_id: string
          p_comment?: string
          p_expected_version?: number
          p_new_status: string
          p_order_id: string
        }
        Returns: Json
      }
      update_sales_order_amounts: {
        Args: { p_amounts: Json; p_order_id: string }
        Returns: undefined
      }
      update_sales_order_status: {
        Args: {
          p_changed_by?: string
          p_new_status: string
          p_order_id: string
        }
        Returns: undefined
      }
      validate_lead_status_transition: {
        Args: { current_user_id: string; lead_id: string; new_status: string }
        Returns: {
          error_message: string
          is_valid: boolean
          required_attachments: Json
        }[]
      }
      validate_sales_order_status_transition: {
        Args: {
          p_new_status: string
          p_sales_order_id: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          is_valid: boolean
          required_fields: string[]
          required_files: string[]
        }[]
      }
    }
    Enums: {
      lead_source_enum: "圣都" | "自然流量" | "转介绍" | "其他"
      lead_status_enum: "待分配" | "待跟踪" | "跟踪中" | "草签" | "已失效"
      points_rule_type: "fixed" | "percentage"
      points_transaction_type:
        | "earn"
        | "spend"
        | "freeze"
        | "unfreeze"
        | "expire"
        | "refund"
        | "pending"
        | "confirm"
      product_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "online"
        | "offline"
      user_role:
        | "admin"
        | "sales"
        | "measurer"
        | "installer"
        | "customer"
        | "partner"
      user_status: "active" | "inactive" | "suspended" | "deleted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      lead_source_enum: ["圣都", "自然流量", "转介绍", "其他"],
      lead_status_enum: ["待分配", "待跟踪", "跟踪中", "草签", "已失效"],
      points_rule_type: ["fixed", "percentage"],
      points_transaction_type: [
        "earn",
        "spend",
        "freeze",
        "unfreeze",
        "expire",
        "refund",
        "pending",
        "confirm",
      ],
      product_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "online",
        "offline",
      ],
      user_role: [
        "admin",
        "sales",
        "measurer",
        "installer",
        "customer",
        "partner",
      ],
      user_status: ["active", "inactive", "suspended", "deleted"],
    },
  },
} as const

