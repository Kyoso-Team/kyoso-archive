ALTER TABLE "player" ADD COLUMN "rank" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "bws_rank" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "player" ADD COLUMN "badge_count" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_role" ADD COLUMN "order" smallint NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "average_rank" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "average_bws_rank" integer NOT NULL;