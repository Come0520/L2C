-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "action" character varying(50) NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create approval_flows table
CREATE TABLE IF NOT EXISTS "public"."approval_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "trigger_type" character varying(50) NOT NULL, -- e.g., 'manual', 'automatic'
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "approval_flows_pkey" PRIMARY KEY ("id")
);

-- Create approval_steps table
CREATE TABLE IF NOT EXISTS "public"."approval_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flow_id" "uuid" NOT NULL REFERENCES "public"."approval_flows"("id") ON DELETE CASCADE,
    "step_order" integer NOT NULL,
    "approver_role" character varying(50), -- e.g., 'manager', 'director'
    "approver_user_id" "uuid" REFERENCES "public"."users"("id") ON DELETE SET NULL,
    "is_final" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS "public"."approval_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "flow_id" "uuid" NOT NULL REFERENCES "public"."approval_flows"("id") ON DELETE RESTRICT,
    "requester_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "current_step_order" integer DEFAULT 1 NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL, -- 'pending', 'approved', 'rejected', 'cancelled'
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- Create approval_actions table
CREATE TABLE IF NOT EXISTS "public"."approval_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL REFERENCES "public"."approval_requests"("id") ON DELETE CASCADE,
    "step_order" integer NOT NULL,
    "actor_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "action" character varying(20) NOT NULL, -- 'approve', 'reject', 'comment'
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

-- Enable RLS
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."approval_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."approval_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."approval_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."approval_actions" ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
CREATE POLICY "audit_logs_admin_read" ON "public"."audit_logs"
    FOR SELECT TO "authenticated"
    USING ("public"."is_admin"());

CREATE POLICY "audit_logs_insert" ON "public"."audit_logs"
    FOR INSERT TO "authenticated"
    WITH CHECK (true);

-- Policies for approval_flows
CREATE POLICY "approval_flows_admin_all" ON "public"."approval_flows"
    TO "authenticated"
    USING ("public"."is_admin"())
    WITH CHECK ("public"."is_admin"());

CREATE POLICY "approval_flows_read_active" ON "public"."approval_flows"
    FOR SELECT TO "authenticated"
    USING ("is_active" = true);

-- Policies for approval_steps
CREATE POLICY "approval_steps_admin_all" ON "public"."approval_steps"
    TO "authenticated"
    USING ("public"."is_admin"())
    WITH CHECK ("public"."is_admin"());

CREATE POLICY "approval_steps_read" ON "public"."approval_steps"
    FOR SELECT TO "authenticated"
    USING (true);

-- Policies for approval_requests
CREATE POLICY "approval_requests_requester_read" ON "public"."approval_requests"
    FOR SELECT TO "authenticated"
    USING ("requester_id" = "auth"."uid"());

CREATE POLICY "approval_requests_admin_read" ON "public"."approval_requests"
    FOR SELECT TO "authenticated"
    USING ("public"."is_admin"());

CREATE POLICY "approval_requests_insert" ON "public"."approval_requests"
    FOR INSERT TO "authenticated"
    WITH CHECK ("requester_id" = "auth"."uid"());

-- Policies for approval_actions
CREATE POLICY "approval_actions_read" ON "public"."approval_actions"
    FOR SELECT TO "authenticated"
    USING (
        EXISTS (
            SELECT 1 FROM "public"."approval_requests" ar
            WHERE ar.id = "approval_actions"."request_id"
            AND (ar.requester_id = "auth"."uid"() OR "public"."is_admin"())
        )
    );

CREATE POLICY "approval_actions_insert" ON "public"."approval_actions"
    FOR INSERT TO "authenticated"
    WITH CHECK ("actor_id" = "auth"."uid"());

-- Indexes
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" ("user_id");
CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" ("entity_type", "entity_id");
CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" ("created_at");

CREATE INDEX "idx_approval_requests_requester" ON "public"."approval_requests" ("requester_id");
CREATE INDEX "idx_approval_requests_status" ON "public"."approval_requests" ("status");
CREATE INDEX "idx_approval_requests_entity" ON "public"."approval_requests" ("entity_type", "entity_id");

CREATE INDEX "idx_approval_actions_request" ON "public"."approval_actions" ("request_id");
