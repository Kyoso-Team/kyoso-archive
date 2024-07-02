DROP INDEX IF EXISTS "idx_player_deleted_at_registered_at";--> statement-breakpoint
ALTER TABLE "osu_user" ADD COLUMN "global_taiko_rank" integer;--> statement-breakpoint
ALTER TABLE "osu_user" ADD COLUMN "global_catch_rank" integer;--> statement-breakpoint
ALTER TABLE "osu_user" ADD COLUMN "global_mania_rank" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "settings" jsonb DEFAULT '{"publicDiscord":false,"publicStaffHistory":true,"publicPlayerHistory":true}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_player_registered_at_joined_team_at_deleted_at" ON "player" USING btree ("registered_at","joined_team_at","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_member_joined_staff_at" ON "staff_member" USING btree ("joined_staff_at" DESC NULLS LAST);