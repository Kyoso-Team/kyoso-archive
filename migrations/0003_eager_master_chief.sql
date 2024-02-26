CREATE TABLE IF NOT EXISTS "notification" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"message_hash" char(32) NOT NULL,
	"message" text NOT NULL,
	CONSTRAINT "uni_notification_message_hash" UNIQUE("message_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notification" (
	"user_id" integer NOT NULL,
	"notified_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"notification_id" bigint NOT NULL,
	CONSTRAINT "user_notification_user_id_notification_id_pk" PRIMARY KEY("user_id","notification_id")
);
--> statement-breakpoint
ALTER TABLE "osu_user_awarded_badge" DROP CONSTRAINT "osu_user_awarded_badge_osu_badge_img_file_name_osu_badge_img_file_name_fk";
--> statement-breakpoint
ALTER TABLE "osu_user_awarded_badge" DROP CONSTRAINT "osu_user_awarded_badge_osu_user_id_osu_badge_img_file_name_pk";--> statement-breakpoint
ALTER TABLE "osu_badge" DROP CONSTRAINT "osu_badge_pkey";--> statement-breakpoint
ALTER TABLE "osu_badge" ADD COLUMN "id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "osu_badge" ADD CONSTRAINT "osu_badge_pkey" PRIMARY KEY("id");--> statement-breakpoint
ALTER TABLE "osu_user_awarded_badge" ADD COLUMN "osu_badge_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "osu_user_awarded_badge" ADD CONSTRAINT "osu_user_awarded_badge_osu_user_id_osu_badge_id_pk" PRIMARY KEY("osu_user_id","osu_badge_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "osu_user_awarded_badge" ADD CONSTRAINT "osu_user_awarded_badge_osu_badge_id_osu_badge_id_fk" FOREIGN KEY ("osu_badge_id") REFERENCES "osu_badge"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "osu_user_awarded_badge" DROP COLUMN IF EXISTS "osu_badge_img_file_name";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "notification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
