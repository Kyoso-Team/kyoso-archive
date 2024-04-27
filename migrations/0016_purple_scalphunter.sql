DROP TABLE "user_notification";--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "notified_at" timestamp (3) with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_id_read_notified_at" ON "notification" ("user_id","read","notified_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
