DO $$ BEGIN
 CREATE TYPE "round_type" AS ENUM('groups', 'swiss', 'qualifiers', 'single_elim', 'double_elim', 'battle_royale');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE "stage";--> statement-breakpoint
ALTER TABLE "round" DROP CONSTRAINT "round_stage_id_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "tournament" DROP CONSTRAINT "tournament_main_stage_id_stage_id_fk";
--> statement-breakpoint
ALTER TABLE "round" ADD COLUMN "type" "round_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "round" DROP COLUMN IF EXISTS "stage_id";--> statement-breakpoint
ALTER TABLE "tournament" DROP COLUMN IF EXISTS "main_stage_id";