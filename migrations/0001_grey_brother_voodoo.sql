ALTER TABLE "user" ADD CONSTRAINT "uni_user_osu_user_id" UNIQUE("osu_user_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "uni_user_discord_user_id" UNIQUE("discord_user_id");