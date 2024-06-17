CREATE TABLE IF NOT EXISTS "form" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"close_at" timestamp (3) with time zone,
	"public" boolean DEFAULT false NOT NULL,
	"anonymous_responses" boolean DEFAULT false NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(2000),
	"thanks_message" varchar(1000),
	"closed_message" varchar(1000),
	"fields_with_responses" char(8)[] DEFAULT '{}'::char[] NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "form_response" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"field_responses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"form_id" integer NOT NULL,
	"submitted_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournament_form" (
	"form_id" integer PRIMARY KEY NOT NULL,
	"type" "tournament_form_type" NOT NULL,
	"target" "tournament_form_target" NOT NULL,
	"tournament_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_response" ADD CONSTRAINT "form_response_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_response" ADD CONSTRAINT "form_response_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_form" ADD CONSTRAINT "tournament_form_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tournament_form" ADD CONSTRAINT "tournament_form_tournament_id_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_form_deleted_at_public_created_at" ON "form" USING btree ("deleted_at","public","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trgm_form_title" ON "form" USING gist (lower("name") gist_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_form_response_form_id_submitted_at" ON "form_response" USING btree ("form_id","submitted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tournament_form_tournament_id_type" ON "tournament_form" USING btree ("tournament_id","type");