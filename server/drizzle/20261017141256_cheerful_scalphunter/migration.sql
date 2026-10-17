CREATE TABLE "bakers" (
	"baker_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bakers_baker_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"baker_name" varchar(255) NOT NULL UNIQUE,
	"baker_url" varchar(255) NOT NULL,
	"baker_image_url" varchar(255) NOT NULL,
	"baker_description" varchar(2048) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bakes" (
	"bake_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bakes_bake_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bake_title" varchar(255) NOT NULL,
	"baker_id" integer NOT NULL,
	"bake_image_url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"user_id" integer PRIMARY KEY,
	"bake_ranking" integer[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bakes" ADD CONSTRAINT "bake_baker_fk" FOREIGN KEY ("baker_id") REFERENCES "bakers"("baker_id");