CREATE TABLE IF NOT EXISTS "scheduled_notification" (
	"notification_id" bigint PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"scheduled_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "user_notification" DROP CONSTRAINT "user_notification_notification_id_notification_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_user_notification_user_id_read_notified_at";--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "notified_at" timestamp (3) with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "global" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "important" boolean NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scheduled_notification" ADD CONSTRAINT "scheduled_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_scheduled_notification_event" ON "scheduled_notification" USING btree ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scheduled_notification_scheduled_at" ON "scheduled_notification" USING btree ("scheduled_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_notified_at" ON "notification" USING btree ("notified_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_id_read" ON "user_notification" USING btree ("user_id","read");--> statement-breakpoint
ALTER TABLE "user_notification" DROP COLUMN IF EXISTS "notified_at";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
	DECLARE
		user_ids INTEGER[];
		offset_value INTEGER := 0;
		-- Notify 1000 users at a time
		limit_value INTEGER := 1000;
	BEGIN
		IF NEW.notified_at IS NOT NULL AND NEW.notified_at >= NOW() THEN
			IF NEW.global THEN
				PERFORM pg_notify('new_notification', json_build_object(
					'notification_id', NEW.id,
					'important', NEW.important,
					'message', NEW.message,
					'notify', 'all'
				));
			ELSE
				LOOP
					SELECT ARRAY(
						SELECT "user_notification"."user_id"
						FROM "user_notification"
						WHERE "user_notification"."notification_id" = NEW."id"
						LIMIT limit_value
						OFFSET offset_value
					) INTO user_ids;
					EXIT WHEN array_length(user_ids, 1) = 0;
					PERFORM pg_notify('new_notification', json_build_object(
						'notification_id', NEW.id,
						'important', NEW.important,
						'message', NEW.message,
						'notify', user_ids
					));
					offset_value := offset_value + limit_value;
				END LOOP;
			END IF;
		END IF;
		RETURN NEW;
	END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE OR REPLACE CONSTRAINT TRIGGER "new_notification_trigger"
AFTER INSERT OR UPDATE OF "notified_at" ON "notification"
INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION notify_new_notification();