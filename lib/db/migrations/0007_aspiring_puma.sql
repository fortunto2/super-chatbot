ALTER TABLE "Document" ADD COLUMN "visibility" varchar DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "tags" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "model" varchar;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "thumbnailUrl" text;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "metadata" json DEFAULT '{}'::json NOT NULL;