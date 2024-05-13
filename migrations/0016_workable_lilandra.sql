ALTER TABLE "tournament" ADD COLUMN "main_stage_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_round_tournament_id_order" ON "round" ("tournament_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stage_tournament_id_order" ON "stage" ("tournament_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_deleted" ON "tournament" ("deleted");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_name_acronym_url_slug" ON "tournament" ("name","acronym","url_slug");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament" ADD CONSTRAINT "tournament_main_stage_id_stage_id_fk" FOREIGN KEY ("main_stage_id") REFERENCES "stage"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "stage" DROP COLUMN IF EXISTS "is_main_stage";