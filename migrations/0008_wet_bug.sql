CREATE TABLE IF NOT EXISTS "user_player_info" (
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"availability" char(99) NOT NULL,
	"badge_count" integer NOT NULL,
	"user_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "updated_at" TO "updated_api_data_at";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_api_data_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "use_team_banners" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ALTER COLUMN "bws_rank" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "rank" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "join_team_request" ADD COLUMN "team_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "user_to_notification" ADD COLUMN "read" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "join_team_request" ADD CONSTRAINT "join_team_request_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "theme";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN IF EXISTS "availability";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN IF EXISTS "rank";--> statement-breakpoint
ALTER TABLE "player" DROP COLUMN IF EXISTS "badge_count";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_player_info" ADD CONSTRAINT "user_player_info_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION set_user_last_notification_at_fn()
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

CREATE OR REPLACE TRIGGER set_user_last_notification_at_trig
AFTER INSERT ON "user_to_notification"
FOR EACH ROW
EXECUTE PROCEDURE set_user_last_notification_at_fn();

CREATE OR REPLACE FUNCTION set_user_updated_api_data_at_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "user"
  SET "updated_api_data_at" = now()
  WHERE NEW."id" = "id";
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_user_updated_api_data_at_trig
AFTER UPDATE
OF
    "osu_username",
    "is_restricted",
    "discord_username",
    "discord_discriminator",
    "osu_access_token",
    "osu_refresh_token",
    "discord_access_token",
    "discord_refresh_token"
ON "user"
FOR EACH ROW
EXECUTE PROCEDURE set_user_updated_api_data_at_fn();

CREATE OR REPLACE FUNCTION set_user_player_info_updated_at_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "user_player_info"
  SET "updated_at" = now()
  WHERE NEW."user_id" = "user_id";
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_user_player_info_updated_at_trig
AFTER UPDATE
OF
    "availability",
    "badge_count"
ON "user_player_info"
FOR EACH ROW
EXECUTE PROCEDURE set_user_player_info_updated_at_fn();