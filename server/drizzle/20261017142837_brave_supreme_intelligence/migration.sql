ALTER TABLE "bakers" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "bakes" DROP CONSTRAINT "bake_baker_fk";--> statement-breakpoint
ALTER TABLE "bakers" DROP COLUMN "baker_id";--> statement-breakpoint
ALTER TABLE "bakers" ADD PRIMARY KEY ("user_id");--> statement-breakpoint
ALTER TABLE "bakers" ADD CONSTRAINT "baker_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id");--> statement-breakpoint
ALTER TABLE "bakes" ADD CONSTRAINT "bake_baker_fk" FOREIGN KEY ("baker_id") REFERENCES "bakers"("user_id");
