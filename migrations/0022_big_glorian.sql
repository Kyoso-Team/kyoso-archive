ALTER TABLE "osu_user" ADD COLUMN "global_taiko_rank" integer;--> statement-breakpoint
ALTER TABLE "osu_user" ADD COLUMN "global_catch_rank" integer;--> statement-breakpoint
ALTER TABLE "osu_user" ADD COLUMN "global_mania_rank" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "settings" jsonb DEFAULT '{"publicDiscord":false,"publicStaffHistory":true,"publicPlayerHistory":true}'::jsonb NOT NULL;