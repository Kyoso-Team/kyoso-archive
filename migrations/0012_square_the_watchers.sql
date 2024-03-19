ALTER TABLE "discord_user" ALTER COLUMN "username" SET DATA TYPE citext;--> statement-breakpoint
ALTER TABLE "osu_user" ALTER COLUMN "username" SET DATA TYPE citext;--> statement-breakpoint
ALTER TABLE "round" ALTER COLUMN "name" SET DATA TYPE citext;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "name" SET DATA TYPE citext;--> statement-breakpoint
ALTER TABLE "staff_role" ALTER COLUMN "name" SET DATA TYPE citext;