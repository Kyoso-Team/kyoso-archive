CREATE TABLE IF NOT EXISTS "tournament_dates" (
	"tournament_id" integer PRIMARY KEY NOT NULL,
	"published_at" timestamp (3) with time zone,
	"concludes_at" timestamp (3) with time zone,
	"player_regs_open_at" timestamp (3) with time zone,
	"player_regs_close_at" timestamp (3) with time zone,
	"staff_regs_open_at" timestamp (3) with time zone,
	"staff_regs_close_at" timestamp (3) with time zone,
	"other" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_dates_published_at" ON "tournament_dates" ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_dates_concludes_at" ON "tournament_dates" ("concludes_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_dates_player_regs_open_at_player_regs_close_at" ON "tournament_dates" ("player_regs_open_at","player_regs_close_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_dates_staff_regs_open_at_regs_close_at" ON "tournament_dates" ("staff_regs_open_at","staff_regs_close_at");--> statement-breakpoint
ALTER TABLE "tournament" DROP COLUMN IF EXISTS "dates";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_dates" ADD CONSTRAINT "tournament_dates_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
