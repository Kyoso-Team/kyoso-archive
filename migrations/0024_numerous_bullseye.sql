CREATE UNIQUE INDEX IF NOT EXISTS "udx_form_response_submitted_by_user_id" ON "form_response" USING btree ("form_id","submitted_by_user_id");

UPDATE "tournament" SET "logo_metadata" = null, "banner_metadata" = null; 