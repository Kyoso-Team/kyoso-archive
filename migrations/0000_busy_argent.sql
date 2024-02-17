CREATE TABLE IF NOT EXISTS "ban" (
	"id" serial PRIMARY KEY NOT NULL,
	"issued_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"lift_at" timestamp (3) with time zone,
	"revoked_at" timestamp (3) with time zone,
	"ban_reason" text NOT NULL,
	"issued_to_user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country" (
	"code" char(2) PRIMARY KEY NOT NULL,
	"name" varchar(35) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discord_user" (
	"discord_user_id" varchar(19) PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"token" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "osu_badge" (
	"img_file_name" varchar(60) PRIMARY KEY NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "osu_user" (
	"osu_user_id" integer PRIMARY KEY NOT NULL,
	"username" varchar(16) NOT NULL,
	"restricted" boolean NOT NULL,
	"global_std_rank" integer,
	"token" jsonb NOT NULL,
	"country_code" char(2) NOT NULL,
	CONSTRAINT "uni_osu_user_username" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "osu_user_awarded_badge" (
	"osu_user_id" integer NOT NULL,
	"osu_badge_img_file_name" varchar(60) NOT NULL,
	"awarded_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "osu_user_awarded_badge_osu_user_id_osu_badge_img_file_name_pk" PRIMARY KEY("osu_user_id","osu_badge_img_file_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"ip_address" "inet" NOT NULL,
	"user_agent" text NOT NULL,
	"expired" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"registered_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_api_data_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"api_key" varchar(24),
	"osu_user_id" integer NOT NULL,
	"discord_user_id" varchar(19) NOT NULL,
	CONSTRAINT "uni_user_api_key" UNIQUE("api_key"),
	CONSTRAINT "uni_user_osu_user_id" UNIQUE("osu_user_id"),
	CONSTRAINT "uni_user_discord_user_id" UNIQUE("discord_user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "osu_user" ADD CONSTRAINT "osu_user_country_code_country_code_fk" FOREIGN KEY ("country_code") REFERENCES "country"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "osu_user_awarded_badge" ADD CONSTRAINT "osu_user_awarded_badge_osu_user_id_osu_user_osu_user_id_fk" FOREIGN KEY ("osu_user_id") REFERENCES "osu_user"("osu_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "osu_user_awarded_badge" ADD CONSTRAINT "osu_user_awarded_badge_osu_badge_img_file_name_osu_badge_img_file_name_fk" FOREIGN KEY ("osu_badge_img_file_name") REFERENCES "osu_badge"("img_file_name") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_osu_user_id_osu_user_osu_user_id_fk" FOREIGN KEY ("osu_user_id") REFERENCES "osu_user"("osu_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_discord_user_id_discord_user_discord_user_id_fk" FOREIGN KEY ("discord_user_id") REFERENCES "discord_user"("discord_user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
