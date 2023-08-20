-- Drizzle doesn't support certain features, so anything Drizzle Kit can't handle will be written here, can be copy and pasted into any migration file
-- Why not append it directly in a migration file in the migrations folder?
-- The migrations folder can be deleted at any time during development to reset migrations as long as Kyoso isn't in production

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