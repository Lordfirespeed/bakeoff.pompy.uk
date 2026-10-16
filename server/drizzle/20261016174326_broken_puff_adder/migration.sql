ALTER TABLE "token_sets" ADD COLUMN "identity_provider" varchar(255);--> statement-breakpoint
ALTER TABLE "token_sets" DROP COLUMN "session_state";--> statement-breakpoint
ALTER TABLE "token_sets" DROP CONSTRAINT "token_sets_pkey";--> statement-breakpoint
ALTER TABLE "token_sets" ADD PRIMARY KEY ("user_id","identity_provider");