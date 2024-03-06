ALTER TABLE "ban" ALTER COLUMN "issued_by_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ban" ADD COLUMN "revoked_by_user_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ban" ADD CONSTRAINT "ban_revoked_by_user_id_user_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
