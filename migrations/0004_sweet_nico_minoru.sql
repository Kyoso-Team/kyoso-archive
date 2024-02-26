ALTER TABLE "user" DROP CONSTRAINT "uni_user_osu_user_id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_user_osu_user_id" ON "user" ("osu_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_notification_id" ON "user_notification" ("notification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_id_notified_at" ON "user_notification" ("user_id","notified_at");