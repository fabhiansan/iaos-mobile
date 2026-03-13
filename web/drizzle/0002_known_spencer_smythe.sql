CREATE TYPE "public"."notification_type" AS ENUM('article', 'donation', 'job', 'announcement');--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" "notification_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "resource_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "link" text;