DROP INDEX IF EXISTS "idx_user_notification_notification_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_user_notification_user_id_notified_at";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_id_read_notified_at" ON "user_notification" ("user_id","read","notified_at" desc);