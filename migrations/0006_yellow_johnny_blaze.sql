ALTER TABLE "user" ADD COLUMN "last_notification_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "modpool" ADD COLUMN "is_tie_breaker" boolean NOT NULL;