CREATE TABLE IF NOT EXISTS "user_to_notification" (
	"user_id" integer NOT NULL,
	"notification_id" integer NOT NULL,
	CONSTRAINT user_to_notification_user_id_notification_id PRIMARY KEY("user_id","notification_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_notification" ADD CONSTRAINT "user_to_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_notification" ADD CONSTRAINT "user_to_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
