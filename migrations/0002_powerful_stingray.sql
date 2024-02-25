DO $$ BEGIN
 CREATE TYPE "staff_color" AS ENUM('slate', 'gray', 'red', 'orange', 'yellow', 'lime', 'green', 'emerald', 'cyan', 'blue', 'indigo', 'purple', 'fuchsia', 'pink');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "staff_permission" AS ENUM('host', 'debug', 'manage_tournament_settings', 'manage_tournament_assets', 'view_staff_members', 'mutate_staff_members', 'delete_staff_members', 'view_regs', 'mutate_regs', 'delete_regs', 'mutate_pool_structure', 'view_pool_suggestions', 'mutate_pool_suggestions', 'delete_pool_suggestions', 'view_pooled_maps', 'mutate_pooled_maps', 'delete_pooled_maps', 'can_playtest', 'view_matches', 'mutate_matches', 'delete_matches', 'ref_matches', 'commentate_matches', 'stream_matches', 'view_stats', 'mutate_stats', 'delete_stats', 'can_play');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "stage_format" AS ENUM('groups', 'swiss', 'qualifiers', 'single_elim', 'double_elim', 'battle_royale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_type" AS ENUM('teams', 'draft', 'solo');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "round" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(20) NOT NULL,
	"order" smallint NOT NULL,
	"target_star_rating" real NOT NULL,
	"playtesting_pool" boolean DEFAULT false NOT NULL,
	"publish_pool" boolean DEFAULT false NOT NULL,
	"publish_schedules" boolean DEFAULT false NOT NULL,
	"publish_stats" boolean DEFAULT false NOT NULL,
	"config" jsonb NOT NULL,
	"stage_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "uni_round_name_tournament_id" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stage" (
	"id" serial PRIMARY KEY NOT NULL,
	"format" "stage_format" NOT NULL,
	"order" smallint NOT NULL,
	"is_main_stage" boolean DEFAULT false NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "uni_stage_tournament_id_format" UNIQUE("tournament_id","format")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"name" varchar(50) NOT NULL,
	"url_slug" varchar(16) NOT NULL,
	"acronym" varchar(8) NOT NULL,
	"type" "tournament_type" NOT NULL,
	"rules" text,
	"logo_metadata" jsonb,
	"banner_metadata" jsonb,
	"rank_range" jsonb,
	"dates" jsonb DEFAULT '{"other":[]}'::jsonb NOT NULL,
	"team_settings" jsonb,
	"bws_values" jsonb,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"referee_settings" jsonb DEFAULT '{"timerLength":{"pick":120,"ban":120,"protect":120,"ready":120,"start":10},"allow":{"doublePick":false,"doubleBan":false,"doubleProtect":false},"order":{"ban":"linear","pick":"linear","protect":"linear"},"alwaysForceNoFail":true,"banAndProtectCancelOut":false,"winCondition":"score"}'::jsonb NOT NULL,
	CONSTRAINT "uni_tournament_name" UNIQUE("name"),
	CONSTRAINT "uni_tournament_url_slug" UNIQUE("url_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_member" (
	"id" serial PRIMARY KEY NOT NULL,
	"joined_staff_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "uni_staff_member_user_id_tournament_id" UNIQUE("user_id","tournament_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_member_role" (
	"staff_member_id" integer NOT NULL,
	"staff_role_id" integer NOT NULL,
	CONSTRAINT "staff_member_role_staff_member_id_staff_role_id_pk" PRIMARY KEY("staff_member_id","staff_role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(45) NOT NULL,
	"color" "staff_color" DEFAULT 'slate' NOT NULL,
	"order" smallint NOT NULL,
	"permissions" staff_permission[] DEFAULT '{}'::staff_permission[] NOT NULL,
	"tournament_id" integer NOT NULL,
	CONSTRAINT "uni_staff_role_name_tournament_id" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "approved_host" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_id_expired" ON "session" ("id","expired");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round" ADD CONSTRAINT "round_stage_id_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "stage"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "round" ADD CONSTRAINT "round_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stage" ADD CONSTRAINT "stage_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member_role" ADD CONSTRAINT "staff_member_role_staff_member_id_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "staff_member"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member_role" ADD CONSTRAINT "staff_member_role_staff_role_id_staff_role_id_fk" FOREIGN KEY ("staff_role_id") REFERENCES "staff_role"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_role" ADD CONSTRAINT "staff_role_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
