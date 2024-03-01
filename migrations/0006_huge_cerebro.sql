DROP INDEX IF EXISTS "idx_ban_issued_to_user_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ban_issued_to_user_id_issued_at" ON "ban" ("issued_to_user_id","issued_at" desc);