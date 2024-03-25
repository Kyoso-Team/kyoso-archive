ALTER TABLE "tournament" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "concludes_at" timestamp;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "player_regs_open_at" date;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "player_regs_close_at" date;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "staff_regs_open_at" date;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "staff_regs_close_at" date;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "other_dates" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_published_at" ON "tournament" ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_concludes_at" ON "tournament" ("concludes_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_player_regs_open_at" ON "tournament" ("player_regs_open_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_player_regs_close_at" ON "tournament" ("player_regs_close_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_staff_regs_open_at" ON "tournament" ("staff_regs_open_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_staff_regs_close_at" ON "tournament" ("staff_regs_close_at");--> statement-breakpoint
ALTER TABLE "tournament" DROP COLUMN IF EXISTS "dates";