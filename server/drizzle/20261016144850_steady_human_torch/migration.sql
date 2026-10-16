CREATE TABLE "session_records" (
	"session_record_id" varchar(255) PRIMARY KEY,
	"user_id" integer,
	"data" json NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_sets" (
	"user_id" integer PRIMARY KEY,
	"token_type" varchar(255),
	"access_token" varchar(255),
	"id_token" varchar(255),
	"refresh_token" varchar(255),
	"scope" varchar(255),
	"access_expires_at" timestamp,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE
);
--> statement-breakpoint
ALTER TABLE "session_records" ADD CONSTRAINT "session_record_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id");--> statement-breakpoint
ALTER TABLE "token_sets" ADD CONSTRAINT "token_set_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id");