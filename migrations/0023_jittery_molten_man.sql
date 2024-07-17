DROP INDEX IF EXISTS "idx_session_id_expired";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_created_at" ON "session" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_last_active_at" ON "session" USING btree ("last_active_at" DESC NULLS LAST);