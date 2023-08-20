ALTER TABLE "user" ALTER COLUMN "last_notification_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "last_notification_at" SET NOT NULL;

CREATE OR REPLACE FUNCTION set_user_last_notification_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "user"
  SET "last_notification_at" = now()
  WHERE NEW."user_id" = "id";
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_user_last_notification_trig
AFTER INSERT ON "user_to_notification"
FOR EACH ROW
EXECUTE PROCEDURE set_user_last_notification_fn();