ALTER TABLE "prize" ALTER COLUMN "additional_items" SET DATA TYPE varchar(65)[];--> statement-breakpoint
ALTER TABLE "staff_application_role" ALTER COLUMN "name" SET DATA TYPE varchar(45);--> statement-breakpoint
ALTER TABLE "staff_application_submission" ALTER COLUMN "applying_for" SET DATA TYPE varchar(45)[];--> statement-breakpoint
ALTER TABLE "staff_application" ALTER COLUMN "title" SET DATA TYPE varchar(90);--> statement-breakpoint
ALTER TABLE "staff_role" ALTER COLUMN "name" SET DATA TYPE varchar(45);--> statement-breakpoint
ALTER TABLE "modpool" ALTER COLUMN "map_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "standard_round" ADD COLUMN "protect_count" smallint NOT NULL;