CREATE TYPE "public"."deployment_mode" AS ENUM('dedicated', 'shared');--> statement-breakpoint
CREATE TYPE "public"."deployment_status" AS ENUM('draft', 'deploying', 'deployed', 'failed', 'stopped');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tenant_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"stt_provider" varchar(64) NOT NULL,
	"stt_config" text,
	"tts_provider" varchar(64) NOT NULL,
	"tts_config" text,
	"voice_id" varchar(255),
	"llm_provider" varchar(64) NOT NULL,
	"llm_model" varchar(128),
	"llm_config" text,
	"vision_enabled" integer DEFAULT 0 NOT NULL,
	"screen_share_enabled" integer DEFAULT 0 NOT NULL,
	"transcribe_enabled" integer DEFAULT 0 NOT NULL,
	"languages" text,
	"avatar_model" varchar(255),
	"system_prompt" text,
	"mcp_gateway_url" varchar(512),
	"mcp_config" text,
	"deployment_mode" "deployment_mode" DEFAULT 'shared' NOT NULL,
	"deployment_status" "deployment_status" DEFAULT 'draft' NOT NULL,
	"deployment_namespace" varchar(128) DEFAULT 'agents',
	"max_concurrent_sessions" integer DEFAULT 10,
	"resource_limits" text,
	"kubernetes_manifest" text,
	"widget_config" text,
	"widget_snippet" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"resource_quota" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;