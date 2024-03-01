ALTER TABLE "osu_user" DROP CONSTRAINT "uni_osu_user_username";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "uni_user_discord_user_id";--> statement-breakpoint
ALTER TABLE "user_notification" DROP CONSTRAINT "user_notification_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ban" ADD COLUMN "revoke_reason" text;--> statement-breakpoint
ALTER TABLE "ban" ADD COLUMN "issued_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "user_notification" ADD COLUMN "read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ban_issued_to_user_id" ON "ban" ("issued_to_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_osu_badge_img_file_name" ON "osu_badge" ("img_file_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_osu_user_username" ON "osu_user" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_osu_user_awarded_badge_osu_user_id" ON "osu_user_awarded_badge" ("osu_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_user_id_expired" ON "session" ("user_id","expired");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_user_discord_user_id" ON "user" ("discord_user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ban" ADD CONSTRAINT "ban_issued_by_user_id_user_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ban" ADD CONSTRAINT "ban_issued_to_user_id_user_id_fk" FOREIGN KEY ("issued_to_user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
