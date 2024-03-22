ALTER TABLE "notification" DROP CONSTRAINT "uni_notification_message_hash";--> statement-breakpoint
ALTER TABLE "notification" DROP COLUMN IF EXISTS "message_hash";