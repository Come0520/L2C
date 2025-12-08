


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lead_source_enum" AS ENUM (
    '圣都',
    '自然流量',
    '转介绍',
    '其他'
);


ALTER TYPE "public"."lead_source_enum" OWNER TO "postgres";


CREATE TYPE "public"."lead_status_enum" AS ENUM (
    '待分配',
    '待跟踪',
    '跟踪中',
    '草签',
    '已失效'
);


ALTER TYPE "public"."lead_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_lead"("p_lead_id" "uuid", "p_assignee_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_user_id uuid;
BEGIN
  -- Get current user id
  v_current_user_id := auth.uid();
  
  -- Update leads table
  UPDATE leads
  SET 
    assigned_to_id = p_assignee_id,
    updated_at = now(),
    status = CASE WHEN status = 'new' THEN 'assigned' ELSE status END
  WHERE id = p_lead_id;

  -- Insert into lead_assignments
  INSERT INTO lead_assignments (
    lead_id,
    user_id,
    assigned_by,
    assigned_at
  ) VALUES (
    p_lead_id,
    p_assignee_id,
    v_current_user_id, -- Assuming the assigner is the current user. If called by system, might need adjustment.
    now()
  );
  
  -- Optional: Create a notification for the assignee (if notification system exists)
END;
$$;


ALTER FUNCTION "public"."assign_lead"("p_lead_id" "uuid", "p_assignee_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_sales_order"("p_lead_id" "uuid", "p_customer_info" "jsonb", "p_order_info" "jsonb", "p_amounts" "jsonb", "p_packages" "jsonb", "p_items" "jsonb"[]) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_customer_id UUID;
  v_sales_order_id UUID;
  v_sales_no TEXT;
  v_item JSONB;
  v_key TEXT;
  v_val TEXT;
BEGIN
  -- 1. 处理客户 (Upsert)
  -- 尝试根据手机号查找客户
  SELECT id INTO v_customer_id FROM customers WHERE phone = p_customer_info->>'phone';
  
  IF v_customer_id IS NULL THEN
    -- 创建新客户
    INSERT INTO customers (name, phone, address)
    VALUES (p_customer_info->>'name', p_customer_info->>'phone', p_customer_info->>'address')
    RETURNING id INTO v_customer_id;
  ELSE
    -- 更新现有客户信息
    UPDATE customers 
    SET name = p_customer_info->>'name', address = p_customer_info->>'address', updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- 2. 生成单号
  v_sales_no := generate_sales_no();

  -- 3. 插入销售单主表
  INSERT INTO sales_orders (
    sales_no, lead_id, customer_id, designer, sales_person, 
    create_time, expected_delivery_time, status
  )
  VALUES (
    v_sales_no, 
    p_lead_id, 
    v_customer_id, 
    p_order_info->>'designer', 
    p_order_info->>'sales_person',
    (p_order_info->>'create_time')::date,
    (p_order_info->>'expected_delivery_time')::date,
    'draft'
  )
  RETURNING id INTO v_sales_order_id;

  -- 4. 插入金额表
  INSERT INTO sales_order_amounts (
    sales_order_id,
    curtain_subtotal, wallcovering_subtotal, background_wall_subtotal,
    window_cushion_subtotal, standard_product_subtotal,
    package_amount, package_excess_amount, upgrade_amount, total_amount
  )
  VALUES (
    v_sales_order_id,
    COALESCE((p_amounts->>'curtain')::numeric, 0),
    COALESCE((p_amounts->>'wallcovering')::numeric, 0),
    COALESCE((p_amounts->>'background-wall')::numeric, 0),
    COALESCE((p_amounts->>'window-cushion')::numeric, 0),
    COALESCE((p_amounts->>'standard-product')::numeric, 0),
    COALESCE((p_amounts->>'packageAmount')::numeric, 0),
    COALESCE((p_amounts->>'packageExcessAmount')::numeric, 0),
    COALESCE((p_amounts->>'upgradeAmount')::numeric, 0),
    COALESCE((p_amounts->>'totalAmount')::numeric, 0)
  );

  -- 5. 插入套餐表
  IF p_packages IS NOT NULL THEN
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_packages)
    LOOP
      INSERT INTO sales_order_packages (sales_order_id, space, package_id)
      VALUES (v_sales_order_id, v_key, v_val);
    END LOOP;
  END IF;

  -- 6. 插入订单项
  IF p_items IS NOT NULL THEN
    FOREACH v_item IN ARRAY p_items
    LOOP
      INSERT INTO sales_order_items (
        sales_order_id, category, space, product, image_url,
        package_tag, is_package_item, package_type,
        unit, width, height, quantity, unit_price,
        usage_amount, amount, price_difference, difference_amount, remark
      )
      VALUES (
        v_sales_order_id,
        v_item->>'category',
        v_item->>'space',
        v_item->>'product',
        v_item->>'imageUrl',
        v_item->>'packageTag',
        COALESCE((v_item->>'isPackageItem')::boolean, false),
        v_item->>'packageType',
        COALESCE(v_item->>'unit', '米'),
        COALESCE((v_item->>'width')::numeric, 0),
        COALESCE((v_item->>'height')::numeric, 0),
        COALESCE((v_item->>'quantity')::int, 1),
        COALESCE((v_item->>'unitPrice')::numeric, 0),
        COALESCE((v_item->>'usageAmount')::numeric, 0),
        COALESCE((v_item->>'amount')::numeric, 0),
        COALESCE((v_item->>'priceDifference')::numeric, 0),
        COALESCE((v_item->>'differenceAmount')::numeric, 0),
        v_item->>'remark'
      );
    END LOOP;
  END IF;

  RETURN v_sales_order_id;
END;
$$;


ALTER FUNCTION "public"."create_sales_order"("p_lead_id" "uuid", "p_customer_info" "jsonb", "p_order_info" "jsonb", "p_amounts" "jsonb", "p_packages" "jsonb", "p_items" "jsonb"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_lead_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.lead_number IS NULL THEN
    -- Format: L + YYYYMMDD + 4 digit sequence (e.g., L202511300001)
    -- This is a simple implementation, for high concurrency consider a sequence
    NEW.lead_number := 'L' || to_char(now(), 'YYYYMMDD') || lpad(cast(floor(random() * 10000) as text), 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_lead_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_sales_no"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_date TEXT;
  v_random TEXT;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  v_random := floor(random() * 9000 + 1000)::text;
  RETURN 'SO' || v_date || v_random;
END;
$$;


ALTER FUNCTION "public"."generate_sales_no"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 创建用户记录
  -- 注意：邮箱认证时，phone存储在raw_user_meta_data中
  INSERT INTO public.users (id, name, phone, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', '未命名用户'),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  -- 创建积分账户（如果points_accounts表存在）
  BEGIN
    INSERT INTO public.points_accounts (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN 
      RAISE WARNING 'Failed to create points account for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO sales_order_status_history (
      sales_order_id, from_status, to_status, changed_by_user_id, created_at
    )
    VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), now()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_order_status_change"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_cache" (
    "id" integer NOT NULL,
    "cache_key" character varying(255) NOT NULL,
    "cache_type" character varying(50) NOT NULL,
    "cache_data" "text" NOT NULL,
    "date_range" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."analytics_cache" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."analytics_cache_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."analytics_cache_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."analytics_cache_id_seq" OWNED BY "public"."analytics_cache"."id";



CREATE TABLE IF NOT EXISTS "public"."collaborations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slide_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collaborations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."installation_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "installation_no" character varying(50) NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "installer_id" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "scheduled_date" "date",
    "actual_date" "date",
    "installation_data" "jsonb",
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."installation_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "follow_up_date" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "email" character varying(100),
    "source" character varying(50) NOT NULL,
    "status" character varying(50) NOT NULL,
    "assigned_to_id" "uuid",
    "created_by_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lead_number" character varying(50),
    "project_address" "text",
    "requirements" "text"[],
    "budget_min" numeric DEFAULT 0,
    "budget_max" numeric DEFAULT 0,
    "customer_level" character varying(10) DEFAULT 'C'::character varying,
    "business_tags" "text"[],
    "appointment_time" timestamp with time zone,
    "appointment_reminder" character varying(20),
    "designer_id" "uuid",
    "shopping_guide_id" "uuid",
    "construction_progress" character varying(50),
    "expected_purchase_date" "date",
    "expected_check_in_date" "date",
    "area_size" numeric
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."measurement_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "measurement_no" character varying(50) NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "measurer_id" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "scheduled_date" "date",
    "actual_date" "date",
    "measurement_data" "jsonb",
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."measurement_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" character varying(50) NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comment" "text"
);


ALTER TABLE "public"."order_status_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_statuses" (
    "id" integer NOT NULL,
    "status_code" character varying(50) NOT NULL,
    "status_name" character varying(100) NOT NULL,
    "phase" character varying(50) NOT NULL,
    "sequence" integer NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_statuses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."order_statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."order_statuses_id_seq" OWNED BY "public"."order_statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_no" character varying(50) NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "sales_id" "uuid" NOT NULL,
    "total_amount" numeric NOT NULL,
    "status" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" character varying(50) NOT NULL,
    "type" character varying(20) NOT NULL,
    "quota" numeric DEFAULT 0 NOT NULL,
    "base_price" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."package_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "price" numeric DEFAULT 0 NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_profiles" (
    "id" integer NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "partner_type" character varying(50) NOT NULL,
    "partner_level" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "store_id" "uuid",
    "store_name" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."partner_profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."partner_profiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."partner_profiles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."partner_profiles_id_seq" OWNED BY "public"."partner_profiles"."id";



CREATE TABLE IF NOT EXISTS "public"."point_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."point_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_exchanges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "total_points" numeric NOT NULL,
    "status" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."point_exchanges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "stock" integer NOT NULL,
    "status" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."point_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "type" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."point_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "category" character varying(50) NOT NULL,
    "status" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reconciliation_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reconciliation_no" character varying(50) NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "paid_amount" numeric DEFAULT 0 NOT NULL,
    "balance_amount" numeric DEFAULT 0 NOT NULL,
    "invoice_no" character varying(50),
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reconciliation_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_amounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "curtain_subtotal" numeric DEFAULT 0 NOT NULL,
    "wallcovering_subtotal" numeric DEFAULT 0 NOT NULL,
    "background_wall_subtotal" numeric DEFAULT 0 NOT NULL,
    "window_cushion_subtotal" numeric DEFAULT 0 NOT NULL,
    "standard_product_subtotal" numeric DEFAULT 0 NOT NULL,
    "package_amount" numeric DEFAULT 0 NOT NULL,
    "package_excess_amount" numeric DEFAULT 0 NOT NULL,
    "upgrade_amount" numeric DEFAULT 0 NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_order_amounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "category" character varying(50) NOT NULL,
    "space" character varying(50) NOT NULL,
    "product" character varying(255) NOT NULL,
    "image_url" character varying(255),
    "package_tag" character varying(50),
    "is_package_item" boolean DEFAULT false NOT NULL,
    "package_type" character varying(20),
    "unit" character varying(20) DEFAULT '米'::character varying NOT NULL,
    "width" numeric DEFAULT 0 NOT NULL,
    "height" numeric DEFAULT 0 NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "usage_amount" numeric DEFAULT 0 NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "price_difference" numeric DEFAULT 0 NOT NULL,
    "difference_amount" numeric DEFAULT 0 NOT NULL,
    "remark" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "space" character varying(50) NOT NULL,
    "package_id" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_order_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_partners" (
    "id" integer NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "partner_id" "uuid" NOT NULL,
    "partner_type" character varying(50) NOT NULL,
    "commission_rate" numeric(5,2),
    "commission_amount" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_order_partners" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_order_partners_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_order_partners_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_order_partners_id_seq" OWNED BY "public"."sales_order_partners"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_order_status_history" (
    "id" integer NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "from_status" character varying(50) NOT NULL,
    "to_status" character varying(50) NOT NULL,
    "changed_by_user_id" "uuid" NOT NULL,
    "change_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sales_order_status_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sales_order_status_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_order_status_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_order_status_history_id_seq" OWNED BY "public"."sales_order_status_history"."id";



CREATE TABLE IF NOT EXISTS "public"."sales_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_no" character varying(50) NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "designer" character varying(100),
    "sales_person" character varying(100),
    "create_time" "date" NOT NULL,
    "expected_delivery_time" "date",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "quote_status" character varying(50),
    "budget_quote_file_url" "text",
    "budget_quote_uploaded_at" timestamp with time zone,
    "push_order_screenshot_url" "text",
    "push_order_uploaded_at" timestamp with time zone,
    "push_order_confirmed_at" timestamp with time zone,
    "push_order_confirmed_by_user_id" "uuid",
    "production_order_nos" "jsonb",
    "all_production_completed_at" timestamp with time zone,
    "designer_id" "uuid",
    "guide_id" "uuid",
    "installation_notes" "text",
    "installation_photo_urls" "jsonb",
    "plan_confirmed_photo_urls" "jsonb"
);


ALTER TABLE "public"."sales_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slide_elements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slide_id" "uuid" NOT NULL,
    "element_type" character varying(20) NOT NULL,
    "properties" "jsonb" NOT NULL,
    "position_x" numeric NOT NULL,
    "position_y" numeric NOT NULL,
    "width" numeric NOT NULL,
    "height" numeric NOT NULL,
    "z_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slide_elements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "content" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "thumbnail_url" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."slides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" character varying(20),
    "name" character varying(100) NOT NULL,
    "avatar_url" character varying(255),
    "role" character varying(20) DEFAULT 'user'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analytics_cache" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."analytics_cache_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."order_statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."order_statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."partner_profiles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."partner_profiles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_order_partners" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_order_partners_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales_order_status_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_order_status_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborations"
    ADD CONSTRAINT "collaborations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborations"
    ADD CONSTRAINT "collaborations_slide_id_user_id_key" UNIQUE ("slide_id", "user_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."installation_orders"
    ADD CONSTRAINT "installation_orders_installation_no_key" UNIQUE ("installation_no");



ALTER TABLE ONLY "public"."installation_orders"
    ADD CONSTRAINT "installation_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_follow_ups"
    ADD CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."measurement_orders"
    ADD CONSTRAINT "measurement_orders_measurement_no_key" UNIQUE ("measurement_no");



ALTER TABLE ONLY "public"."measurement_orders"
    ADD CONSTRAINT "measurement_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_statuses"
    ADD CONSTRAINT "order_statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_statuses"
    ADD CONSTRAINT "order_statuses_status_code_key" UNIQUE ("status_code");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_no_key" UNIQUE ("sales_no");



ALTER TABLE ONLY "public"."package_items"
    ADD CONSTRAINT "package_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_profiles"
    ADD CONSTRAINT "partner_profiles_partner_id_key" UNIQUE ("partner_id");



ALTER TABLE ONLY "public"."partner_profiles"
    ADD CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_accounts"
    ADD CONSTRAINT "point_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_accounts"
    ADD CONSTRAINT "point_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."point_exchanges"
    ADD CONSTRAINT "point_exchanges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_products"
    ADD CONSTRAINT "point_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reconciliation_orders"
    ADD CONSTRAINT "reconciliation_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reconciliation_orders"
    ADD CONSTRAINT "reconciliation_orders_reconciliation_no_key" UNIQUE ("reconciliation_no");



ALTER TABLE ONLY "public"."sales_order_amounts"
    ADD CONSTRAINT "sales_order_amounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_amounts"
    ADD CONSTRAINT "sales_order_amounts_sales_order_id_key" UNIQUE ("sales_order_id");



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_packages"
    ADD CONSTRAINT "sales_order_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_packages"
    ADD CONSTRAINT "sales_order_packages_sales_order_id_space_key" UNIQUE ("sales_order_id", "space");



ALTER TABLE ONLY "public"."sales_order_partners"
    ADD CONSTRAINT "sales_order_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_status_history"
    ADD CONSTRAINT "sales_order_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_sales_no_key" UNIQUE ("sales_no");



ALTER TABLE ONLY "public"."slide_elements"
    ADD CONSTRAINT "slide_elements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slides"
    ADD CONSTRAINT "slides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_analytics_cache_expires_at" ON "public"."analytics_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_installation_orders_sales_order_id" ON "public"."installation_orders" USING "btree" ("sales_order_id");



CREATE INDEX "idx_leads_assigned_to_id" ON "public"."leads" USING "btree" ("assigned_to_id");



CREATE INDEX "idx_leads_created_by_id" ON "public"."leads" USING "btree" ("created_by_id");



CREATE INDEX "idx_leads_designer_id" ON "public"."leads" USING "btree" ("designer_id");



CREATE INDEX "idx_leads_lead_number" ON "public"."leads" USING "btree" ("lead_number");



CREATE INDEX "idx_leads_shopping_guide_id" ON "public"."leads" USING "btree" ("shopping_guide_id");



CREATE INDEX "idx_measurement_orders_sales_order_id" ON "public"."measurement_orders" USING "btree" ("sales_order_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_sales_id" ON "public"."orders" USING "btree" ("sales_id");



CREATE INDEX "idx_point_accounts_user_id" ON "public"."point_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_point_exchanges_user_id" ON "public"."point_exchanges" USING "btree" ("user_id");



CREATE INDEX "idx_point_transactions_user_id" ON "public"."point_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_reconciliation_orders_sales_order_id" ON "public"."reconciliation_orders" USING "btree" ("sales_order_id");



CREATE INDEX "idx_sales_order_items_category" ON "public"."sales_order_items" USING "btree" ("category");



CREATE INDEX "idx_sales_order_items_sales_order_id" ON "public"."sales_order_items" USING "btree" ("sales_order_id");



CREATE INDEX "idx_sales_order_packages_sales_order_id" ON "public"."sales_order_packages" USING "btree" ("sales_order_id");



CREATE INDEX "idx_sales_orders_customer_id" ON "public"."sales_orders" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_orders_lead_id" ON "public"."sales_orders" USING "btree" ("lead_id");



CREATE OR REPLACE TRIGGER "on_order_status_change" AFTER UPDATE ON "public"."sales_orders" FOR EACH ROW EXECUTE FUNCTION "public"."record_order_status_change"();



CREATE OR REPLACE TRIGGER "tr_generate_lead_number" BEFORE INSERT ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."generate_lead_number"();



ALTER TABLE ONLY "public"."collaborations"
    ADD CONSTRAINT "collaborations_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "public"."slides"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborations"
    ADD CONSTRAINT "collaborations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."installation_orders"
    ADD CONSTRAINT "installation_orders_installer_id_fkey" FOREIGN KEY ("installer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."installation_orders"
    ADD CONSTRAINT "installation_orders_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_assignments"
    ADD CONSTRAINT "lead_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_follow_ups"
    ADD CONSTRAINT "lead_follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_follow_ups"
    ADD CONSTRAINT "lead_follow_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_shopping_guide_id_fkey" FOREIGN KEY ("shopping_guide_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."measurement_orders"
    ADD CONSTRAINT "measurement_orders_measurer_id_fkey" FOREIGN KEY ("measurer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."measurement_orders"
    ADD CONSTRAINT "measurement_orders_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_status_logs"
    ADD CONSTRAINT "order_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_items"
    ADD CONSTRAINT "package_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_accounts"
    ADD CONSTRAINT "point_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_exchanges"
    ADD CONSTRAINT "point_exchanges_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."point_products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_exchanges"
    ADD CONSTRAINT "point_exchanges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reconciliation_orders"
    ADD CONSTRAINT "reconciliation_orders_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_amounts"
    ADD CONSTRAINT "sales_order_amounts_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_packages"
    ADD CONSTRAINT "sales_order_packages_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_partners"
    ADD CONSTRAINT "sales_order_partners_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_profiles"("partner_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_partners"
    ADD CONSTRAINT "sales_order_partners_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_status_history"
    ADD CONSTRAINT "sales_order_status_history_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slide_elements"
    ADD CONSTRAINT "slide_elements_slide_id_fkey" FOREIGN KEY ("slide_id") REFERENCES "public"."slides"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."slides"
    ADD CONSTRAINT "slides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."analytics_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_cache_admin_all" ON "public"."analytics_cache" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_assignments_admin_all" ON "public"."lead_assignments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "lead_assignments_self_read" ON "public"."lead_assignments" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."leads" "l" ON (("l"."id" = "lead_assignments"."lead_id")))
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("l"."assigned_to_id" = "u"."id") OR ("l"."created_by_id" = "u"."id"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."lead_follow_ups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_follow_ups_admin_all" ON "public"."lead_follow_ups" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "lead_follow_ups_self_read" ON "public"."lead_follow_ups" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("lead_follow_ups"."user_id" = "u"."id") OR (EXISTS ( SELECT 1
           FROM "public"."leads" "l"
          WHERE (("l"."id" = "lead_follow_ups"."lead_id") AND ("l"."assigned_to_id" = "u"."id")))))))) OR "public"."is_admin"()));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_admin_all" ON "public"."leads" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "leads_self_read" ON "public"."leads" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("leads"."assigned_to_id" = "u"."id") OR ("leads"."created_by_id" = "u"."id"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_admin_all" ON "public"."order_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "order_items_self_read" ON "public"."order_items" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."orders" "o" ON (("o"."id" = "order_items"."order_id")))
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("o"."customer_id" = "u"."id") OR ("o"."sales_id" = "u"."id"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."order_status_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_status_logs_admin_all" ON "public"."order_status_logs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "order_status_logs_self_read" ON "public"."order_status_logs" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."orders" "o" ON (("o"."id" = "order_status_logs"."order_id")))
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("o"."customer_id" = "u"."id") OR ("o"."sales_id" = "u"."id"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_admin_all" ON "public"."orders" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "orders_self_read" ON "public"."orders" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND (("orders"."customer_id" = "u"."id") OR ("orders"."sales_id" = "u"."id"))))) OR "public"."is_admin"()));



ALTER TABLE "public"."partner_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_accounts_admin_all" ON "public"."point_accounts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "point_accounts_self_read" ON "public"."point_accounts" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("point_accounts"."user_id" = "u"."id")))) OR "public"."is_admin"()));



ALTER TABLE "public"."point_exchanges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_exchanges_admin_all" ON "public"."point_exchanges" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "point_exchanges_self_read" ON "public"."point_exchanges" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("point_exchanges"."user_id" = "u"."id")))) OR "public"."is_admin"()));



ALTER TABLE "public"."point_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_products_admin_all" ON "public"."point_products" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "point_products_all_read" ON "public"."point_products" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."point_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_transactions_admin_all" ON "public"."point_transactions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "point_transactions_self_read" ON "public"."point_transactions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("point_transactions"."user_id" = "u"."id")))) OR "public"."is_admin"()));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_admin_all" ON "public"."products" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "products_all_read" ON "public"."products" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."sales_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_admin_all" ON "public"."users" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "users_self_read" ON "public"."users" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."id" = "users"."id")))) OR "public"."is_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."assign_lead"("p_lead_id" "uuid", "p_assignee_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_lead"("p_lead_id" "uuid", "p_assignee_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_lead"("p_lead_id" "uuid", "p_assignee_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_sales_order"("p_lead_id" "uuid", "p_customer_info" "jsonb", "p_order_info" "jsonb", "p_amounts" "jsonb", "p_packages" "jsonb", "p_items" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_sales_order"("p_lead_id" "uuid", "p_customer_info" "jsonb", "p_order_info" "jsonb", "p_amounts" "jsonb", "p_packages" "jsonb", "p_items" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_sales_order"("p_lead_id" "uuid", "p_customer_info" "jsonb", "p_order_info" "jsonb", "p_amounts" "jsonb", "p_packages" "jsonb", "p_items" "jsonb"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_lead_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_lead_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_lead_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_sales_no"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_sales_no"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_sales_no"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_order_status_change"() TO "service_role";


















GRANT ALL ON TABLE "public"."analytics_cache" TO "anon";
GRANT ALL ON TABLE "public"."analytics_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_cache" TO "service_role";



GRANT ALL ON SEQUENCE "public"."analytics_cache_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."analytics_cache_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."analytics_cache_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."collaborations" TO "anon";
GRANT ALL ON TABLE "public"."collaborations" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborations" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."installation_orders" TO "anon";
GRANT ALL ON TABLE "public"."installation_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."installation_orders" TO "service_role";



GRANT ALL ON TABLE "public"."lead_assignments" TO "anon";
GRANT ALL ON TABLE "public"."lead_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."lead_follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."lead_follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_follow_ups" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."measurement_orders" TO "anon";
GRANT ALL ON TABLE "public"."measurement_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."measurement_orders" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_logs" TO "anon";
GRANT ALL ON TABLE "public"."order_status_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_logs" TO "service_role";



GRANT ALL ON TABLE "public"."order_statuses" TO "anon";
GRANT ALL ON TABLE "public"."order_statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."order_statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."package_items" TO "anon";
GRANT ALL ON TABLE "public"."package_items" TO "authenticated";
GRANT ALL ON TABLE "public"."package_items" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."partner_profiles" TO "anon";
GRANT ALL ON TABLE "public"."partner_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."partner_profiles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."partner_profiles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."partner_profiles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."point_accounts" TO "anon";
GRANT ALL ON TABLE "public"."point_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."point_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."point_exchanges" TO "anon";
GRANT ALL ON TABLE "public"."point_exchanges" TO "authenticated";
GRANT ALL ON TABLE "public"."point_exchanges" TO "service_role";



GRANT ALL ON TABLE "public"."point_products" TO "anon";
GRANT ALL ON TABLE "public"."point_products" TO "authenticated";
GRANT ALL ON TABLE "public"."point_products" TO "service_role";



GRANT ALL ON TABLE "public"."point_transactions" TO "anon";
GRANT ALL ON TABLE "public"."point_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."reconciliation_orders" TO "anon";
GRANT ALL ON TABLE "public"."reconciliation_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."reconciliation_orders" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_amounts" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_amounts" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_amounts" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_packages" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_packages" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_partners" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_partners" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_order_partners_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_order_partners_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_order_partners_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_order_status_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_order_status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_order_status_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sales_orders" TO "anon";
GRANT ALL ON TABLE "public"."sales_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_orders" TO "service_role";



GRANT ALL ON TABLE "public"."slide_elements" TO "anon";
GRANT ALL ON TABLE "public"."slide_elements" TO "authenticated";
GRANT ALL ON TABLE "public"."slide_elements" TO "service_role";



GRANT ALL ON TABLE "public"."slides" TO "anon";
GRANT ALL ON TABLE "public"."slides" TO "authenticated";
GRANT ALL ON TABLE "public"."slides" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































