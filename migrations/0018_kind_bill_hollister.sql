CREATE EXTENSION IF NOT EXISTS "pg_trgm";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "invite_reason" AS ENUM('join_team', 'join_staff', 'delegate_host');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "invite_status" AS ENUM('pending', 'accepted', 'rejected', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_form_target" AS ENUM('public', 'staff', 'players', 'team_captains');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tournament_form_type" AS ENUM('general', 'staff_registration');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "staff_permission" ADD VALUE 'manage_theme';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sent_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"reason" "invite_reason" NOT NULL,
	"by_user_id" integer,
	"to_user_id" integer,
	"team_id" integer,
	"tournament_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invite_with_role" (
	"invite_id" bigint NOT NULL,
	"staff_role_id" integer NOT NULL,
	CONSTRAINT "invite_with_role_invite_id_staff_role_id_pk" PRIMARY KEY("invite_id","staff_role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"joined_team_at" timestamp (3) with time zone,
	"deleted_at" timestamp (3) with time zone,
	"bws_rank" integer,
	"availability" integer[4] DEFAULT '{0,0,0,0}'::integer[] NOT NULL,
	"user_id" integer,
	"tournament_id" integer NOT NULL,
	"team_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"name" varchar(20) NOT NULL,
	"banner_metadata" jsonb,
	"tournament_id" integer NOT NULL,
	"captain_player_id" integer NOT NULL,
	CONSTRAINT "uni_team_name_tournament_id" UNIQUE("name","tournament_id")
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "uni_user_api_key";--> statement-breakpoint
ALTER TABLE "staff_member" DROP CONSTRAINT "uni_staff_member_user_id_tournament_id";--> statement-breakpoint
ALTER TABLE "staff_member" DROP CONSTRAINT "staff_member_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "udx_osu_user_username";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tournament_deleted";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_tournament_name_acronym_url_slug";--> statement-breakpoint
ALTER TABLE "discord_user" ALTER COLUMN "username" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "osu_user" ALTER COLUMN "username" SET DATA TYPE varchar(15);--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "name" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "staff_member" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_role" ALTER COLUMN "name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "round" ADD COLUMN "publish_pool_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "round" ADD COLUMN "publish_schedules_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "round" ADD COLUMN "publish_stats_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "deleted_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "mod_multipliers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "staff_member" ADD COLUMN "deleted_at" timestamp (3) with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invite_status_reason_to_user_id_sent_at" ON "invite" ("status","reason","to_user_id","sent_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invite_team_id" ON "invite" ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invite_tournament_id" ON "invite" ("tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_player_tournament_id_team_id_user_id" ON "player" ("tournament_id","team_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_player_deleted_at_registered_at" ON "player" ("deleted_at","registered_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_team_captain_player_id_tournament_id" ON "team" ("captain_player_id","tournament_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trgm_team_name" ON "team" USING gist (lower("team"."name") gist_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_team_deleted_at_registered_at" ON "team" ("deleted_at","registered_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trgm_osu_user_username" ON "osu_user" USING gist (lower("osu_user"."username") gist_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_admin_approved_host" ON "user" ("admin","approved_host");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_user_api_key" ON "user" ("api_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_updated_api_data_at" ON "user" ("updated_api_data_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_notification_id" ON "user_notification" ("notification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_deleted_at" ON "tournament" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trgm_tournament_name_acronym" ON "tournament" USING gist ((lower("tournament"."name") || ' ' || lower("tournament"."acronym")) gist_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_staff_member_user_id_tournament_id" ON "staff_member" ("user_id","tournament_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_member_deleted_at" ON "staff_member" ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_role_tournament_id_order" ON "staff_role" ("tournament_id","order");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "round" DROP COLUMN IF EXISTS "publish_pool";--> statement-breakpoint
ALTER TABLE "round" DROP COLUMN IF EXISTS "publish_schedules";--> statement-breakpoint
ALTER TABLE "round" DROP COLUMN IF EXISTS "publish_stats";--> statement-breakpoint
ALTER TABLE "tournament" DROP COLUMN IF EXISTS "deleted";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite" ADD CONSTRAINT "invite_by_user_id_user_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite" ADD CONSTRAINT "invite_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite" ADD CONSTRAINT "invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite" ADD CONSTRAINT "invite_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite_with_role" ADD CONSTRAINT "invite_with_role_invite_id_invite_id_fk" FOREIGN KEY ("invite_id") REFERENCES "invite"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invite_with_role" ADD CONSTRAINT "invite_with_role_staff_role_id_staff_role_id_fk" FOREIGN KEY ("staff_role_id") REFERENCES "staff_role"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player" ADD CONSTRAINT "player_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team" ADD CONSTRAINT "team_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team" ADD CONSTRAINT "team_captain_player_id_player_id_fk" FOREIGN KEY ("captain_player_id") REFERENCES "player"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "osu_user" ADD CONSTRAINT "uni_osu_user_username" UNIQUE("username");
--> statement-breakpoint
DROP EXTENSION IF EXISTS "citext";