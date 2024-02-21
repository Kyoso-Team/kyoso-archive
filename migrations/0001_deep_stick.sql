ALTER TABLE "session" ADD COLUMN "ip_metadata" jsonb;
UPDATE "session"
SET "ip_metadata" = '{"city":"","region":"","country":""}'::jsonb
WHERE "session"."ip_metadata" is null;
ALTER TABLE "session" ALTER COLUMN "ip_metadata" SET NOT NULL;
