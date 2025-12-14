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
          updated_at: string
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
      audit_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          request_context: Json | null
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          request_context?: Json | null
          table_name: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          request_context?: Json | null
          table_name?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          channel_manager_id: number | null
          city: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          id: number
          key_person: string | null
          name: string
          scale: string | null
          status: string | null
          store_sales_manager_id: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          channel_manager_id?: number | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          key_person?: string | null
          name: string
          scale?: string | null
          status?: string | null
          store_sales_manager_id?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_manager_id?: number | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          key_person?: string | null
          name?: string
          scale?: string | null
          status?: string | null
          store_sales_manager_id?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_channel_manager_id_fkey"
            columns: ["channel_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_store_sales_manager_id_fkey"
            columns: ["store_sales_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_order_date: string | null
          level: string | null
          name: string
          order_count: number | null
          phone: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_order_date?: string | null
          level?: string | null
          name: string
          order_count?: number | null
          phone?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_order_date?: string | null
          level?: string | null
          name?: string
          order_count?: number | null
          phone?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          assigned_by_id: number | null
          assigned_to_id: number
          assignment_method: string | null
          created_at: string
          id: number
          lead_id: number
          reason: string | null
          updated_at: string
        }
        Insert: {
          assigned_by_id?: number | null
          assigned_to_id: number
          assignment_method?: string | null
          created_at?: string
          id?: number
          lead_id: number
          reason?: string | null
          updated_at?: string
        }
        Update: {
          assigned_by_id?: number | null
          assigned_to_id?: number
          assignment_method?: string | null
          created_at?: string
          id?: number
          lead_id?: number
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          attachments: string | null
          completed_at: string | null
          content: string
          created_at: string
          deleted_at: string | null
          followup_type: string
          id: number
          is_completed: boolean
          lead_id: number
          next_followup_date: string | null
          priority: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          attachments?: string | null
          completed_at?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          followup_type: string
          id?: number
          is_completed?: boolean
          lead_id: number
          next_followup_date?: string | null
          priority?: string | null
          updated_at: string
          user_id: number
        }
        Update: {
          attachments?: string | null
          completed_at?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          followup_type?: string
          id?: number
          is_completed?: boolean
          lead_id?: number
          next_followup_date?: string | null
          priority?: string | null
          updated_at?: string
          user_id?: number
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
      lead_merge_history: {
        Row: {
          duplicate_lead_ids: number[]
          id: number
          merged_at: string
          merged_by_id: number | null
          notes: string | null
          primary_lead_id: number
        }
        Insert: {
          duplicate_lead_ids: number[]
          id?: number
          merged_at?: string
          merged_by_id?: number | null
          notes?: string | null
          primary_lead_id: number
        }
        Update: {
          duplicate_lead_ids?: number[]
          id?: number
          merged_at?: string
          merged_by_id?: number | null
          notes?: string | null
          primary_lead_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_merge_history_primary_lead_id_fkey"
            columns: ["primary_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_reminder: string | null
          appointment_time: string | null
          assigned_to_id: number | null
          business_tags: Json | null
          converted_at: string | null
          created_at: string
          created_by_id: number
          customer_name: string
          deleted_at: string | null
          designer_id: number | null
          email: string | null
          estimated_value: number | null
          id: number
          last_follow_up_at: string | null
          lead_number: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string
          priority: string
          project_address: string | null
          referrer_id: number | null
          referrer_name: string | null
          shopping_guide_id: number | null
          source: string
          source_channel_id: number | null
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          appointment_reminder?: string | null
          appointment_time?: string | null
          assigned_to_id?: number | null
          business_tags?: Json | null
          converted_at?: string | null
          created_at?: string
          created_by_id: number
          customer_name: string
          deleted_at?: string | null
          designer_id?: number | null
          email?: string | null
          estimated_value?: number | null
          id?: number
          last_follow_up_at?: string | null
          lead_number?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone: string
          priority?: string
          project_address?: string | null
          referrer_id?: number | null
          referrer_name?: string | null
          shopping_guide_id?: number | null
          source?: string
          source_channel_id?: number | null
          status?: string
          updated_at: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          appointment_reminder?: string | null
          appointment_time?: string | null
          assigned_to_id?: number | null
          business_tags?: Json | null
          converted_at?: string | null
          created_at?: string
          created_by_id?: number
          customer_name?: string
          deleted_at?: string | null
          designer_id?: number | null
          email?: string | null
          estimated_value?: number | null
          id?: number
          last_follow_up_at?: string | null
          lead_number?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string
          priority?: string
          project_address?: string | null
          referrer_id?: number | null
          referrer_name?: string | null
          shopping_guide_id?: number | null
          source?: string
          source_channel_id?: number | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
            foreignKeyName: "leads_referrer_id_fkey"
            columns: ["referrer_id"]
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
          {
            foreignKeyName: "leads_source_channel_id_fkey"
            columns: ["source_channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          lead_id: number | null
          order_id: number | null
          status: string | null
          title: string | null
          type: string | null
          user_id: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          lead_id?: number | null
          order_id?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          user_id?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          lead_id?: number | null
          order_id?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
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
          assigned_by_id: number
          assignment_type: string | null
          created_at: string
          id: number
          metadata: Json | null
          new_assignee_id: number
          old_assignee_id: number | null
          order_id: number
          reason: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_id: number
          assignment_type?: string | null
          created_at?: string
          id?: number
          metadata?: Json | null
          new_assignee_id: number
          old_assignee_id?: number | null
          order_id: number
          reason?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_id?: number
          assignment_type?: string | null
          created_at?: string
          id?: number
          metadata?: Json | null
          new_assignee_id?: number
          old_assignee_id?: number | null
          order_id?: number
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
          id: number
          notes: string | null
          order_id: number
          product_category: string
          product_id: number
          product_name: string
          quantity: number
          specifications: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: number
          notes?: string | null
          order_id: number
          product_category: string
          product_id: number
          product_name: string
          quantity: number
          specifications?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          id?: number
          notes?: string | null
          order_id?: number
          product_category?: string
          product_id?: number
          product_name?: string
          quantity?: number
          specifications?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_logs: {
        Row: {
          change_reason: string | null
          changed_by_id: number
          created_at: string
          from_status: string | null
          id: number
          notes: string | null
          order_id: number
          status_type: string
          to_status: string
        }
        Insert: {
          change_reason?: string | null
          changed_by_id: number
          created_at?: string
          from_status?: string | null
          id?: number
          notes?: string | null
          order_id: number
          status_type: string
          to_status: string
        }
        Update: {
          change_reason?: string | null
          changed_by_id?: number
          created_at?: string
          from_status?: string | null
          id?: number
          notes?: string | null
          order_id?: number
          status_type?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_changed_by_id_fkey"
            columns: ["changed_by_id"]
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
          changed_by_id: number | null
          comment: string | null
          created_at: string
          from_status: string | null
          id: number
          ip_address: unknown
          metadata: Json | null
          order_id: number
          reason_category: string | null
          to_status: string
          transition_duration_seconds: number | null
          user_agent: string | null
        }
        Insert: {
          changed_at?: string
          changed_by_id?: number | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          order_id: number
          reason_category?: string | null
          to_status: string
          transition_duration_seconds?: number | null
          user_agent?: string | null
        }
        Update: {
          changed_at?: string
          changed_by_id?: number | null
          comment?: string | null
          created_at?: string
          from_status?: string | null
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          order_id?: number
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
      orders: {
        Row: {
          actual_delivery_date: string | null
          actual_install_date: string | null
          created_at: string
          customer_address: string
          customer_email: string | null
          customer_id: number
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          delivery_status: string
          discount_amount: number
          expected_delivery_date: string | null
          expected_install_date: string | null
          id: number
          installation_fee: number
          installation_status: string
          internal_notes: string | null
          last_status_change_at: string | null
          last_status_change_by_id: string | null
          lead_id: number | null
          notes: string | null
          order_date: string
          order_number: string
          paid_amount: number
          payment_status: string
          priority: string
          sales_id: number
          shipping_fee: number
          source: string
          status: string
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
          version: number
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_install_date?: string | null
          created_at?: string
          customer_address: string
          customer_email?: string | null
          customer_id: number
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          delivery_status?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          expected_install_date?: string | null
          id?: number
          installation_fee?: number
          installation_status?: string
          internal_notes?: string | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_id?: number | null
          notes?: string | null
          order_date?: string
          order_number: string
          paid_amount?: number
          payment_status?: string
          priority?: string
          sales_id: number
          shipping_fee?: number
          source?: string
          status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount: number
          updated_at: string
          version?: number
        }
        Update: {
          actual_delivery_date?: string | null
          actual_install_date?: string | null
          created_at?: string
          customer_address?: string
          customer_email?: string | null
          customer_id?: number
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          delivery_status?: string
          discount_amount?: number
          expected_delivery_date?: string | null
          expected_install_date?: string | null
          id?: number
          installation_fee?: number
          installation_status?: string
          internal_notes?: string | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          lead_id?: number | null
          notes?: string | null
          order_date?: string
          order_number?: string
          paid_amount?: number
          payment_status?: string
          priority?: string
          sales_id?: number
          shipping_fee?: number
          source?: string
          status?: string
          subtotal_amount?: number
          tax_amount?: number
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
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      point_accounts: {
        Row: {
          available_points: number
          created_at: string
          frozen_points: number
          id: number
          level: number
          lifetime_earned: number
          lifetime_spent: number
          pending_points: number
          total_points: number
          updated_at: string
          user_id: number
        }
        Insert: {
          available_points?: number
          created_at?: string
          frozen_points?: number
          id?: number
          level?: number
          lifetime_earned?: number
          lifetime_spent?: number
          pending_points?: number
          total_points?: number
          updated_at: string
          user_id: number
        }
        Update: {
          available_points?: number
          created_at?: string
          frozen_points?: number
          id?: number
          level?: number
          lifetime_earned?: number
          lifetime_spent?: number
          pending_points?: number
          total_points?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "point_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      point_exchanges: {
        Row: {
          created_at: string
          id: number
          notes: string | null
          points_spent: number
          product_id: number
          quantity: number
          shipping_address: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          notes?: string | null
          points_spent: number
          product_id: number
          quantity?: number
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          notes?: string | null
          points_spent?: number
          product_id?: number
          quantity?: number
          shipping_address?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "point_exchanges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "point_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_exchanges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      point_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_unlimited_stock: boolean
          max_exchange_per_user: number | null
          name: string
          points_required: number
          sort_order: number
          status: string
          stock_quantity: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_unlimited_stock?: boolean
          max_exchange_per_user?: number | null
          name: string
          points_required: number
          sort_order?: number
          status?: string
          stock_quantity?: number | null
          updated_at: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_unlimited_stock?: boolean
          max_exchange_per_user?: number | null
          name?: string
          points_required?: number
          sort_order?: number
          status?: string
          stock_quantity?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      point_rules: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          point_calculation: string
          priority: number
          trigger_condition: string | null
          trigger_type: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          point_calculation: string
          priority?: number
          trigger_condition?: string | null
          trigger_type: string
          updated_at: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          point_calculation?: string
          priority?: number
          trigger_condition?: string | null
          trigger_type?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          account_id: number | null
          balance_after: number
          business_status: string | null
          created_at: string
          description: string | null
          expected_confirm_time: string | null
          expires_at: string | null
          id: number
          pending_reason: string | null
          points: number
          rule_id: number | null
          source_id: number | null
          source_type: string | null
          status: string
          transaction_type: string
          trigger_condition: string | null
          updated_at: string
          user_id: number
        }
        Insert: {
          account_id?: number | null
          balance_after: number
          business_status?: string | null
          created_at?: string
          description?: string | null
          expected_confirm_time?: string | null
          expires_at?: string | null
          id?: number
          pending_reason?: string | null
          points: number
          rule_id?: number | null
          source_id?: number | null
          source_type?: string | null
          status?: string
          transaction_type: string
          trigger_condition?: string | null
          updated_at: string
          user_id: number
        }
        Update: {
          account_id?: number | null
          balance_after?: number
          business_status?: string | null
          created_at?: string
          description?: string | null
          expected_confirm_time?: string | null
          expires_at?: string | null
          id?: number
          pending_reason?: string | null
          points?: number
          rule_id?: number | null
          source_id?: number | null
          source_type?: string | null
          status?: string
          transaction_type?: string
          trigger_condition?: string | null
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "point_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "point_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          status?: string
          unit: string
          updated_at: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: number
          name: string
          password: string
          phone: string | null
          role: string
          status: string
          supabase_uid: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: number
          name: string
          password: string
          phone?: string | null
          role?: string
          status?: string
          supabase_uid?: string | null
          updated_at: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: number
          name?: string
          password?: string
          phone?: string | null
          role?: string
          status?: string
          supabase_uid?: string | null
          updated_at?: string
        }
        Relationships: []
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
      index_usage_stats: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          index_size: string | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
          usage_level: string | null
        }
        Relationships: []
      }
      query_performance_stats: {
        Row: {
          calls: number | null
          max_time: number | null
          mean_time: number | null
          min_time: number | null
          performance_level: string | null
          query: string | null
          stddev_time: number | null
          total_time: number | null
        }
        Relationships: []
      }
      v_order_audit_log: {
        Row: {
          audit_id: number | null
          changed_at: string | null
          changed_by_email: string | null
          changed_by_id: number | null
          changed_by_name: string | null
          comment: string | null
          customer_name: string | null
          from_status: string | null
          from_status_name: string | null
          ip_address: unknown
          metadata: Json | null
          order_id: number | null
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
      batch_assign_sales_person: {
        Args: {
          p_assigned_by_id: number
          p_order_ids: number[]
          p_reason?: string
          p_sales_person_id: number
        }
        Returns: Json
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
      cancel_order: {
        Args: {
          p_cancellation_reason: string
          p_cancelled_by_id: string
          p_order_id: string
        }
        Returns: Json
      }
      create_order: { Args: { order_data: Json }; Returns: number }
      current_user_id: { Args: never; Returns: number }
      find_duplicate_leads_by_phone: {
        Args: { p_limit?: number }
        Returns: {
          latest_created_at: string
          lead_count: number
          lead_details: Json
          lead_ids: number[]
          phone: string
        }[]
      }
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
      get_lead_warnings: { Args: never; Returns: Json }
      get_order_assignment_history: {
        Args: { p_order_id: number }
        Returns: {
          assigned_at: string
          assigned_by_name: string
          assignment_id: number
          assignment_type: string
          new_assignee_name: string
          old_assignee_name: string
          reason: string
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
      get_sales_person_assignment_stats: {
        Args: {
          p_end_date?: string
          p_sales_person_id: number
          p_start_date?: string
        }
        Returns: {
          assignments_as_new: number
          assignments_as_old: number
          avg_hold_duration_hours: number
          total_assignments: number
        }[]
      }
      insert_order_items_from_array: {
        Args: { p_category: string; p_items: Json; p_order_id: number }
        Returns: undefined
      }
      is_valid_status_transition: {
        Args: { p_from_status: string; p_to_status: string }
        Returns: boolean
      }
      merge_leads: {
        Args: {
          p_duplicate_ids: number[]
          p_merged_by_id: number
          p_notes?: string
          p_primary_id: number
        }
        Returns: Json
      }
      update_order: {
        Args: { order_data: Json; p_order_id: number }
        Returns: undefined
      }
      update_order_status: {
        Args: {
          p_changed_by_id: string
          p_new_status: string
          p_order_id: number
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
