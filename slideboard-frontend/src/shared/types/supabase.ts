export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      share_tokens: {
        Row: {
          id: string
          resource_type: string
          resource_id: string
          token: string
          created_by: string
          expires_at: string | null
          is_active: boolean
          scope: string
          usage_count: number
          max_usage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resource_type: string
          resource_id: string
          token: string
          created_by: string
          expires_at?: string | null
          is_active?: boolean
          scope?: string
          usage_count?: number
          max_usage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resource_type?: string
          resource_id?: string
          token?: string
          created_by?: string
          expires_at?: string | null
          is_active?: boolean
          scope?: string
          usage_count?: number
          max_usage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      measurement_orders: {
        Row: {
          id: string
          quote_version_id: string
          sales_order_id: string | null
          measurer_id: string | null
          status: string
          scheduled_at: string | null
          completed_at: string | null
          measurement_data: Json | null
          measurement_photos: string[] | null
          measurement_report_url: string | null
          created_by: string
          created_at: string
          updated_at: string
          measurement_no: string | null
        }
        Insert: {
          id?: string
          quote_version_id: string
          sales_order_id?: string | null
          measurer_id?: string | null
          status: string
          scheduled_at?: string | null
          completed_at?: string | null
          measurement_data?: Json | null
          measurement_photos?: string[] | null
          measurement_report_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          measurement_no?: string | null
        }
        Update: {
          id?: string
          quote_version_id?: string
          sales_order_id?: string | null
          measurer_id?: string | null
          status?: string
          scheduled_at?: string | null
          completed_at?: string | null
          measurement_data?: Json | null
          measurement_photos?: string[] | null
          measurement_report_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          measurement_no?: string | null
        }
        Relationships: [
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
          }
        ]
      }
      sales_orders: {
        Row: {
          id: string
          sales_no: string
          customer_id: string | null
          status: string
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sales_no: string
          customer_id?: string | null
          status: string
          total_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sales_no?: string
          customer_id?: string | null
          status?: string
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          phone: string
          project_address: string | null
          source: string | null
          status: string
          customer_level: string | null
          budget_min: number | null
          budget_max: number | null
          requirements: string[] | null
          business_tags: string[] | null
          appointment_time: string | null
          appointment_reminder: string | null
          construction_progress: string | null
          expected_purchase_date: string | null
          expected_check_in_date: string | null
          area_size: number | null
          lead_number: string
          quote_versions: number
          measurement_completed: boolean
          installation_completed: boolean
          financial_status: string | null
          expected_measurement_date: string | null
          expected_installation_date: string | null
          total_quote_amount: number | null
          last_status_change_at: string | null
          last_status_change_by_id: string | null
          is_cancelled: boolean
          cancellation_reason: string | null
          is_paused: boolean
          pause_reason: string | null
          assigned_to_id: string | null
          designer_id: string | null
          shopping_guide_id: string | null
          created_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          project_address?: string | null
          source?: string | null
          status: string
          customer_level?: string | null
          budget_min?: number | null
          budget_max?: number | null
          requirements?: string[] | null
          business_tags?: string[] | null
          appointment_time?: string | null
          appointment_reminder?: string | null
          construction_progress?: string | null
          expected_purchase_date?: string | null
          expected_check_in_date?: string | null
          area_size?: number | null
          lead_number: string
          quote_versions?: number
          measurement_completed?: boolean
          installation_completed?: boolean
          financial_status?: string | null
          expected_measurement_date?: string | null
          expected_installation_date?: string | null
          total_quote_amount?: number | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          is_paused?: boolean
          pause_reason?: string | null
          assigned_to_id?: string | null
          designer_id?: string | null
          shopping_guide_id?: string | null
          created_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          project_address?: string | null
          source?: string | null
          status?: string
          customer_level?: string | null
          budget_min?: number | null
          budget_max?: number | null
          requirements?: string[] | null
          business_tags?: string[] | null
          appointment_time?: string | null
          appointment_reminder?: string | null
          construction_progress?: string | null
          expected_purchase_date?: string | null
          expected_check_in_date?: string | null
          area_size?: number | null
          lead_number?: string
          quote_versions?: number
          measurement_completed?: boolean
          installation_completed?: boolean
          financial_status?: string | null
          expected_measurement_date?: string | null
          expected_installation_date?: string | null
          total_quote_amount?: number | null
          last_status_change_at?: string | null
          last_status_change_by_id?: string | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          is_paused?: boolean
          pause_reason?: string | null
          assigned_to_id?: string | null
          designer_id?: string | null
          shopping_guide_id?: string | null
          created_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          lead_id: string | null
          name: string
          phone: string
          project_address: string | null
          customer_type: string
          contact_info: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          name: string
          phone: string
          project_address?: string | null
          customer_type?: string
          contact_info?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          name?: string
          phone?: string
          project_address?: string | null
          customer_type?: string
          contact_info?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          quote_no: string
          lead_id: string | null
          customer_id: string | null
          project_name: string | null
          project_address: string | null
          salesperson_id: string | null
          current_version_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_no: string
          lead_id?: string | null
          customer_id?: string | null
          project_name?: string | null
          project_address?: string | null
          salesperson_id?: string | null
          current_version_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_no?: string
          lead_id?: string | null
          customer_id?: string | null
          project_name?: string | null
          project_address?: string | null
          salesperson_id?: string | null
          current_version_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      quote_versions: {
        Row: {
          id: string
          quote_id: string
          version_number: number
          version_suffix: string | null
          total_amount: number
          status: string
          valid_until: string | null
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          version_number: number
          version_suffix?: string | null
          total_amount?: number
          status?: string
          valid_until?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quote_id?: string
          version_number?: number
          version_suffix?: string | null
          total_amount?: number
          status?: string
          valid_until?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_version_id: string
          category: string
          space: string
          product_name: string
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          description: string | null
          image_url: string | null
          attributes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          quote_version_id: string
          category: string
          space: string
          product_name: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          description?: string | null
          image_url?: string | null
          attributes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          quote_version_id?: string
          category?: string
          space?: string
          product_name?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          description?: string | null
          image_url?: string | null
          attributes?: Json | null
          created_at?: string
        }
      }
      installation_orders: {
        Row: {
          id: string
          sales_order_id: string
          measurement_id: string | null
          installation_no: string
          installation_type: string
          status: string
          acceptance_status: string
          scheduled_at: string | null
          appointment_time_slot: string | null
          estimated_duration: number | null
          installation_contact: string | null
          installation_phone: string | null
          project_address: string | null
          installer_id: string | null
          installation_team_id: string | null
          environment_requirements: Json | null
          required_tools: string[] | null
          required_materials: Json | null
          special_instructions: string | null
          installation_data: Json | null
          installation_photos: string[] | null
          customer_signature: string | null
          rework_count: number
          installation_fee: number
          additional_fee: number
          material_fee: number
          created_by: string
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sales_order_id: string
          measurement_id?: string | null
          installation_no?: string
          installation_type?: string
          status: string
          acceptance_status?: string
          scheduled_at?: string | null
          appointment_time_slot?: string | null
          estimated_duration?: number | null
          installation_contact?: string | null
          installation_phone?: string | null
          project_address?: string | null
          installer_id?: string | null
          installation_team_id?: string | null
          environment_requirements?: Json | null
          required_tools?: string[] | null
          required_materials?: Json | null
          special_instructions?: string | null
          installation_data?: Json | null
          installation_photos?: string[] | null
          customer_signature?: string | null
          rework_count?: number
          installation_fee?: number
          additional_fee?: number
          material_fee?: number
          created_by?: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          sales_order_id?: string
          measurement_id?: string | null
          installation_no?: string
          installation_type?: string
          status?: string
          acceptance_status?: string
          scheduled_at?: string | null
          appointment_time_slot?: string | null
          estimated_duration?: number | null
          installation_contact?: string | null
          installation_phone?: string | null
          project_address?: string | null
          installer_id?: string | null
          installation_team_id?: string | null
          environment_requirements?: Json | null
          required_tools?: string[] | null
          required_materials?: Json | null
          special_instructions?: string | null
          installation_data?: Json | null
          installation_photos?: string[] | null
          customer_signature?: string | null
          rework_count?: number
          installation_fee?: number
          additional_fee?: number
          material_fee?: number
          created_by?: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
            {
              foreignKeyName: "installation_orders_sales_order_id_fkey"
              columns: ["sales_order_id"]
              isOneToOne: false
              referencedRelation: "sales_orders"
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
                foreignKeyName: "installation_orders_installation_team_id_fkey"
                columns: ["installation_team_id"]
                isOneToOne: false
                referencedRelation: "installation_teams"
                referencedColumns: ["id"]
            }
        ]
      }
      installation_teams: {
        Row: {
            id: string
            name: string
            leader_id: string | null
            members: string[] | null
            status: string
            created_at: string
            updated_at: string
        }
        Insert: {
            id?: string
            name: string
            leader_id?: string | null
            members?: string[] | null
            status?: string
            created_at?: string
            updated_at?: string
        }
        Update: {
            id?: string
            name?: string
            leader_id?: string | null
            members?: string[] | null
            status?: string
            created_at?: string
            updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          purchase_no: string
          sales_order_id: string
          supplier_id: string | null
          total_amount: number
          status: string
          expected_delivery_date: string | null
          actual_delivery_date: string | null
          remarks: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          purchase_no: string
          sales_order_id: string
          supplier_id?: string | null
          total_amount?: number
          status: string
          expected_delivery_date?: string | null
          actual_delivery_date?: string | null
          remarks?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          purchase_no?: string
          sales_order_id?: string
          supplier_id?: string | null
          total_amount?: number
          status?: string
          expected_delivery_date?: string | null
          actual_delivery_date?: string | null
          remarks?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          purchase_order_id: string
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          specifications: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          purchase_order_id: string
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          specifications?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          purchase_order_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          specifications?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          contact_phone: string | null
          address: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          contact_phone?: string | null
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          contact_phone?: string | null
          address?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      reconciliation_statements: {
        Row: {
          id: string
          statement_no: string
          type: string
          target_id: string
          period_start: string
          period_end: string
          total_amount: number
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          statement_no: string
          type: string
          target_id: string
          period_start: string
          period_end: string
          total_amount: number
          status: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          statement_no?: string
          type?: string
          target_id?: string
          period_start?: string
          period_end?: string
          total_amount?: number
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      reconciliation_items: {
        Row: {
          id: string
          statement_id: string
          source_type: string
          source_id: string
          amount: number
          date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          statement_id: string
          source_type: string
          source_id: string
          amount: number
          date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          statement_id?: string
          source_type?: string
          source_id?: string
          amount?: number
          date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_statements"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          product_code: string
          product_name: string
          category_level1: string
          category_level2: string
          unit: string
          status: string
          prices: Json
          attributes: Json
          images: Json
          tags: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_code: string
          product_name: string
          category_level1: string
          category_level2: string
          unit: string
          status: string
          prices?: Json
          attributes?: Json
          images?: Json
          tags?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_code?: string
          product_name?: string
          category_level1?: string
          category_level2?: string
          unit?: string
          status?: string
          prices?: Json
          attributes?: Json
          images?: Json
          tags?: Json
          created_at?: string
          updated_at?: string
        }
      }
      mall_products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          points_required: number
          stock_quantity: number
          image_url: string | null
          is_available: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          points_required: number
          stock_quantity: number
          image_url?: string | null
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          points_required?: number
          stock_quantity?: number
          image_url?: string | null
          is_available?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      mall_orders: {
        Row: {
          id: string
          user_id: string
          product_id: string
          product_name: string
          points_spent: number
          status: string
          tracking_number: string | null
          shipping_address: string
          contact_phone: string
          remark: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          product_name: string
          points_spent: number
          status: string
          tracking_number?: string | null
          shipping_address: string
          contact_phone: string
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          product_name?: string
          points_spent?: number
          status?: string
          tracking_number?: string | null
          shipping_address?: string
          contact_phone?: string
          remark?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      points_accounts: {
        Row: {
          id: string
          user_id: string
          total_points: number
          available_points: number
          frozen_points: number
          pending_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_points?: number
          available_points?: number
          frozen_points?: number
          pending_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_points?: number
          available_points?: number
          frozen_points?: number
          pending_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      points_transactions: {
        Row: {
          id: string
          account_id: string
          amount: number
          type: string
          source_type: string
          source_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          amount: number
          type: string
          source_type: string
          source_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          amount?: number
          type?: string
          source_type?: string
          source_id?: string | null
          description?: string | null
          created_at?: string
        }
      }
      workflow_definitions: {
        Row: {
          id: string
          code: string
          name: string
          category: string
          order_index: number
          color: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          category: string
          order_index: number
          color: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          category?: string
          order_index?: number
          color?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lead_tags: {
        Row: {
          id: string
          name: string
          tag_category: string
          tag_type: string | null
          color: string
          description: string | null
          sort_order: number
          is_active: boolean
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tag_category?: string
          tag_type?: string | null
          color?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tag_category?: string
          tag_type?: string | null
          color?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workflow_transition_rules: {
        Row: {
          id: string
          from_status: string
          to_status: string
          required_fields: string[] | null
          required_files: string[] | null
          required_permissions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_status: string
          to_status: string
          required_fields?: string[] | null
          required_files?: string[] | null
          required_permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_status?: string
          to_status?: string
          required_fields?: string[] | null
          required_files?: string[] | null
          required_permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
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
