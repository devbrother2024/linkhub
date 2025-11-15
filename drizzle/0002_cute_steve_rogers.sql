CREATE TYPE "public"."payment_status" AS ENUM('SUCCESS', 'FAILED', 'CANCELLED', 'PENDING');--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriptionId" text NOT NULL,
	"orderId" text NOT NULL,
	"paymentKey" text,
	"paymentMethod" text NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "currentPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "customerKey" text;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;