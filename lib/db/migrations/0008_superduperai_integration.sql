ALTER TABLE "User"
ADD COLUMN "superduperai_token" text;
ALTER TABLE "User"
ADD COLUMN "superduperai_user_id" varchar(255);
ALTER TABLE "User"
ADD COLUMN "superduperai_balance" integer DEFAULT 0;
ALTER TABLE "User"
ADD COLUMN "superduperai_connected_at" timestamp;