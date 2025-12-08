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
          id: number
          user_id: number
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
          avatar: string | null
          city: string | null
          created_at: string | null
          created_by: number | null
          email: string | null
          gender: string | null
          id: number
          level: string | null
          name: string
          phone: string | null
          remark: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          wechat: string | null
        }
        Insert: {
          address?: string | null
          avatar?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          gender?: string | null
          id?: number
          level?: string | null
          name: string
          phone?: string | null
          remark?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          wechat?: string | null
        }
        Update: {
          address?: string | null
          avatar?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: number | null
          email?: string | null
          gender?: string | null
          id?: number
          level?: string | null
          name?: string
          phone?: string | null
          remark?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          wechat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      installation_team_members: {
        Row: {
          installer_id: string
          joined_at: string
          team_id: number
        }
        Insert: {
          installer_id: string
          joined_at?: string
          team_id: number
        }
        Update: {
          installer_id?: string
          joined_at?: string
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "installation_team_members_installer_id_fkey"
            columns: ["installer_id"]
            isOneToOne: false
            referencedRelation: "installers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "installation_teams"
            referencedColumns: ["id"]
          }
        ]
      }
      installation_teams: {
        Row: {
          created_at: string | null
          id: number
          name: string
          status: string
          team_leader_id: string | null
          total_members: number
          completed_installations: number
          average_rating: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          status?: string
          team_leader_id?: string | null
          total_members?: number
          completed_installations?: number
          average_rating?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          status?: string
          team_leader_id?: string | null
          total_members?: number
          completed_installations?: number
          average_rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "installers"
            referencedColumns: ["id"]
          }
        ]
      }
      installations: {
        Row: {
          address: string | null
          completed_at: string | null
          created_at: string | null
          customer_feedback: string | null
          customer_rating: number | null
          customer_signature: string | null
          id: number
          install_date: string | null
          installer_id: number | null
          items: Json | null
          notes: string | null
          order_id: number | null
          photos: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          customer_signature?: string | null
          id?: number
          install_date?: string | null
          installer_id?: number | null
          items?: Json | null
          notes?: string | null
          order_id?: number | null
          photos?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_rating?: number | null
          customer_signature?: string | null
          id?: number
          install_date?: string | null
          installer_id?: number | null
          items?: Json | null
          notes?: string | null
          order_id?: number | null
          photos?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installations_installer_id_fkey"
            columns: ["installer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      installers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone: string
          avatar: string | null
          skill_level: string | null
          skills: Json | null
          qualifications: Json | null
          years_of_experience: number
          work_time: Json | null
          performance_rating: number
          completed_installations: number
          canceled_installations: number
          rework_installations: number
          total_working_hours: number
          status: string
          team_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone: string
          avatar?: string | null
          skill_level?: string | null
          skills?: Json | null
          qualifications?: Json | null
          years_of_experience?: number
          work_time?: Json | null
          performance_rating?: number
          completed_installations?: number
          canceled_installations?: number
          rework_installations?: number
          total_working_hours?: number
          status?: string
          team_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          avatar?: string | null
          skill_level?: string | null
          skills?: Json | null
          qualifications?: Json | null
          years_of_experience?: number
          work_time?: Json | null
          performance_rating?: number
          completed_installations?: number
          canceled_installations?: number
          rework_installations?: number
          total_working_hours?: number
          status?: string
          team_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "installation_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_approval_records: {
        Row: {
          approval_reason: string | null
          approval_status: string | null
          approval_type: string
          approved_at: string | null
          approved_by_id: string | null
          created_at: string | null
          id: string
          lead_id: string
          updated_at: string | null
        }
        Insert: {
          approval_reason?: string | null
          approval_status?: string | null
          approval_type: string
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          updated_at?: string | null
        }
        Update: {
          approval_reason?: string | null
          approval_status?: string | null
          approval_type?: string
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_approval_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attachment_records: {
        Row: {
          attachment_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          lead_id: string
          uploaded_at: string | null
          uploaded_by_id: string | null
        }
        Insert: {
          attachment_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id: string
          uploaded_at?: string | null
          uploaded_by_id?: string | null
        }
        Update: {
          attachment_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          lead_id?: string
          uploaded_at?: string | null
          uploaded_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_attachment_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_up_records: {
        Row: {
          appointment_time: string | null
          content: string | null
          created_at: string | null
          created_by_id: string | null
          follow_up_type: string
          id: string
          lead_id: string
          next_follow_up_time: string | null
          note: string | null
          result: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_time?: string | null
          content?: string | null
          created_at?: string | null
          created_by_id?: string | null
          follow_up_type: string
          id?: string
          lead_id: string
          next_follow_up_time?: string | null
          note?: string | null
          result?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_time?: string | null
          content?: string | null
          created_at?: string | null
          created_by_id?: string | null
          follow_up_type?: string
          id?: string
          lead_id?: string
          next_follow_up_time?: string | null
          note?: string | null
          result?: string | null
          updated_at?: string | null
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
      lead_installation_records: {
        Row: {
          created_at: string | null
          id: string
          installation_address: string | null
          installation_person: string | null
          installation_time: string | null
          lead_id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          installation_address?: string | null
          installation_person?: string | null
          installation_time?: string | null
          lead_id: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          installation_address?: string | null
          installation_person?: string | null
          installation_time?: string | null
          lead_id?: string
          notes?: string | null
          updated_at?: string | null
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
          created_at: string | null
          id: string
          lead_id: string
          measurement_address: string | null
          measurement_person: string | null
          measurement_time: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          measurement_address?: string | null
          measurement_person?: string | null
          measurement_time?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          measurement_address?: string | null
          measurement_person?: string | null
          measurement_time?: string | null
          notes?: string | null
          updated_at?: string | null
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
      lead_quote_records: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          quote_amount: number | null
          quote_number: string | null
          quote_status: string | null
          quote_time: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          quote_amount?: number | null
          quote_number?: string | null
          quote_status?: string | null
          quote_time?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          quote_amount?: number | null
          quote_number?: string | null
          quote_status?: string | null
          quote_time?: string | null
          updated_at?: string | null
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
      lead_status_history: {
        Row: {
          changed_at: string | null
          changed_by_id: string | null
          comment: string | null
          from_status: string | null
          id: string
          lead_id: string | null
          to_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by_id?: string | null
          comment?: string | null
          from_status?: string | null
          id?: string
          lead_id?: string | null
          to_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by_id?: string | null
          comment?: string | null
          from_status?: string | null
          id?: string
          lead_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_relations: {
        Row: {
          assigned_at: string | null
          assigned_by_id: string | null
          lead_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          lead_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_id?: string | null
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_relations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          sort_order: number
          tag_category: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          sort_order?: number
          tag_category?: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          sort_order?: number
          tag_category?: string
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
          created_at: string | null
          created_by_id: string | null
          customer_level: string
          designer_id: string | null
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
          pause_reason: string | null
          phone: string
          project_address: string | null
          quote_versions: number | null
          requirements: string[] | null
          shopping_guide_id: string | null
          source: string | null
          status: string
          total_quote_amount: number | null
          updated_at: string | null
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
          created_at?: string | null
          created_by_id?: string | null
          customer_level?: string
          designer_id?: string | null
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
          pause_reason?: string | null
          phone: string
          project_address?: string | null
          quote_versions?: number | null
          requirements?: string[] | null
          shopping_guide_id?: string | null
          source?: string | null
          status?: string
          total_quote_amount?: number | null
          updated_at?: string | null
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
          created_at?: string | null
          created_by_id?: string | null
          customer_level?: string
          designer_id?: string | null
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
          pause_reason?: string | null
          phone?: string
          project_address?: string | null
          quote_versions?: number | null
          requirements?: string[] | null
          shopping_guide_id?: string | null
          source?: string | null
          status?: string
          total_quote_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_current_owner_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_orders: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
          id: number
          last_urged_at: string | null
          order_id: number | null
          photos: string[] | null
          rooms: Json | null
          status: string | null
          surveyor_id: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: number
          last_urged_at?: string | null
          order_id?: number | null
          photos?: string[] | null
          rooms?: Json | null
          status?: string | null
          surveyor_id?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: number
          last_urged_at?: string | null
          order_id?: number | null
          photos?: string[] | null
          rooms?: Json | null
          status?: string | null
          surveyor_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurement_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_orders_surveyor_id_fkey"
            columns: ["surveyor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          id: number
          is_read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: number
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: number
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: number
          is_read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: number
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
      order_items: {
        Row: {
          category: string
          created_at: string | null
          id: number
          order_id: number | null
          product_id: number | null
          product_name: string
          quantity: number
          remarks: string | null
          specifications: string | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: number
          order_id?: number | null
          product_id?: number | null
          product_name: string
          quantity: number
          remarks?: string | null
          specifications?: string | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          order_id?: number | null
          product_id?: number | null
          product_name?: string
          quantity?: number
          remarks?: string | null
          specifications?: string | null
          unit_price?: number
          updated_at?: string | null
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
      orders: {
        Row: {
          actual_delivery_date: string | null
          actual_install_date: string | null
          created_at: string | null
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
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          actual_install_date?: string | null
          created_at?: string | null
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
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          actual_install_date?: string | null
          created_at?: string | null
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
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      points_coefficient_rules: {
        Row: {
          id: number
          status: string
          start_time: string
          end_time: string
          product_category: string
          region_code: string
          final_coefficient: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          status: string
          start_time: string
          end_time: string
          product_category: string
          region_code: string
          final_coefficient: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          status?: string
          start_time?: string
          end_time?: string
          product_category?: string
          region_code?: string
          final_coefficient?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: number
          is_active: boolean
          name: string
          parent_id: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          name: string
          parent_id?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          name?: string
          parent_id?: number | null
          slug?: string
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
          base_price: number | null
          category_id: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: number
          images: string[] | null
          is_active: boolean
          min_stock: number
          model: string | null
          name: string
          sale_price: number | null
          sku: string
          specifications: Json | null
          stock: number
          supplier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category_id?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          images?: string[] | null
          is_active?: boolean
          min_stock?: number
          model?: string | null
          name: string
          sale_price?: number | null
          sku: string
          specifications?: Json | null
          stock?: number
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category_id?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          images?: string[] | null
          is_active?: boolean
          min_stock?: number
          model?: string | null
          name?: string
          sale_price?: number | null
          sku?: string
          specifications?: Json | null
          stock?: number
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission: string
          role: string
        }
        Insert: {
          created_at?: string | null
          permission: string
          role: string
        }
        Update: {
          created_at?: string | null
          permission?: string
          role?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          id: number
          monthly_target: number | null
          status: string | null
          store_id: number | null
          updated_at: string | null
          user_id: number
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          id?: number
          monthly_target?: number | null
          status?: string | null
          store_id?: number | null
          updated_at?: string | null
          user_id: number
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          id?: number
          monthly_target?: number | null
          status?: string | null
          store_id?: number | null
          updated_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_packages: {
        Row: {
          id: number
          package_name: string
          package_price: number
          sales_order_id: number | null
          usage_details: Json
        }
        Insert: {
          id?: number
          package_name: string
          package_price: number
          sales_order_id?: number | null
          usage_details: Json
        }
        Update: {
          id?: number
          package_name?: string
          package_price?: number
          sales_order_id?: number | null
          usage_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_packages_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string | null
          created_by: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          resource_id: number
          resource_type: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          resource_id: number
          resource_type: string
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          resource_id?: number
          resource_type?: string
          token?: string
          updated_at?: string | null
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
      stores: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string | null
          id: number
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: number
          last_login_at: string | null
          name: string
          password: string
          phone: string | null
          role: string
          status: string | null
          supabase_uid: string | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id?: number
          last_login_at?: string | null
          name: string
          password: string
          phone?: string | null
          role?: string
          status?: string | null
          supabase_uid?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: number
          last_login_at?: string | null
          name?: string
          password?: string
          phone?: string | null
          role?: string
          status?: string | null
          supabase_uid?: string | null
          updated_at?: string | null
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
      [_ in never]: never
    }
    Functions: {
      assign_lead: {
        Args: {
          p_lead_id: string
          p_assignee_id: string
          p_reason: string
        }
        Returns: undefined
      }
      assign_tag_to_lead: {
        Args: {
          p_lead_id: string
          p_tag_id: string
          p_assigned_by_id: string
        }
        Returns: undefined
      }
      batch_update_orders: {
        Args: {
          p_order_ids: number[]
          p_action: string
          p_data: Json
        }
        Returns: Json
      }
      check_phone_exists: {
        Args: {
          p_phone: string
          p_exclude_id: string
        }
        Returns: boolean
      }
      create_order: {
        Args: {
          order_data: Json
        }
        Returns: number
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_lead_status_history: {
        Args: {
          lead_id: string
        }
        Returns: {
          id: string
          from_status: string
          to_status: string
          changed_by_id: string
          changed_by_name: string
          changed_at: string
          comment: string
        }[]
      }
      get_lead_tags: {
        Args: {
          p_lead_id: string
        }
        Returns: {
          id: string
          name: string
          color: string
          tag_category: string
          assigned_at: string
          assigned_by_name: string
        }[]
      }
      get_order_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_order_status_history: {
        Args: {
          p_order_id: number
        }
        Returns: Json
      }
      remove_tag_from_lead: {
        Args: {
          p_lead_id: string
          p_tag_id: string
          p_removed_by_id: string
        }
        Returns: boolean
      }
      update_order_status: {
        Args: {
          p_order_id: number
          p_new_status: string
          p_changed_by_id: string
        }
        Returns: undefined
      }
      validate_lead_status_transition: {
        Args: {
          lead_id: string
          new_status: string
          current_user_id: string
        }
        Returns: {
          is_valid: boolean
          error_message: string
        }[]
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


type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type PublicSchema = Database[Extract<keyof Database, "public">]


export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never