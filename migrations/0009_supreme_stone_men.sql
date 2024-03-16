ALTER TYPE "staff_permission" ADD VALUE 'manage_tournament';--> statement-breakpoint
ALTER TYPE "staff_permission" ADD VALUE 'manage_assets';--> statement-breakpoint
ALTER TYPE "staff_permission" ADD VALUE 'manage_regs';--> statement-breakpoint
ALTER TYPE "staff_permission" ADD VALUE 'manage_pool_structure';--> statement-breakpoint
ALTER TABLE "tournament" DROP CONSTRAINT "uni_tournament_url_slug";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "udx_tournament_url_slug" ON "tournament" ("url_slug");