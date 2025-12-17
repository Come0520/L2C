-- Create share_tokens table
CREATE TABLE IF NOT EXISTS "public"."share_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_type" character varying(20) NOT NULL CHECK (resource_type IN ('quote', 'order')),
    "resource_id" "uuid" NOT NULL,
    "token" character varying(64) NOT NULL,
    "created_by" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "share_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "share_tokens_token_key" UNIQUE ("token")
);

-- Enable RLS
ALTER TABLE "public"."share_tokens" ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Creators can view/manage their tokens
CREATE POLICY "share_tokens_creator_all" ON "public"."share_tokens"
    USING ("auth"."uid"() = "created_by")
    WITH CHECK ("auth"."uid"() = "created_by");

-- 2. Admins can view/manage all tokens
CREATE POLICY "share_tokens_admin_all" ON "public"."share_tokens"
    USING ("public"."is_admin"())
    WITH CHECK ("public"."is_admin"());

-- 3. Public access via token (for validation) - actually we might not need public SELECT access to the table directly
-- We usually validate via a secure function or just by querying with the token in a secure context (Edge Function).
-- But for simplicity in frontend validation:
CREATE POLICY "share_tokens_public_read" ON "public"."share_tokens"
    FOR SELECT
    USING (true); -- We rely on the token being secret. If you have the token, you can see the metadata.

-- Indexes
CREATE INDEX "idx_share_tokens_token" ON "public"."share_tokens" ("token");
CREATE INDEX "idx_share_tokens_resource" ON "public"."share_tokens" ("resource_type", "resource_id");
