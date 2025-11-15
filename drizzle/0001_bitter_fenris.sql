CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"originalUrl" text NOT NULL,
	"slug" text NOT NULL,
	"expiresAt" timestamp,
	"clickLimit" integer,
	"clickCount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "linkEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"linkId" text NOT NULL,
	"eventType" text DEFAULT 'CLICK' NOT NULL,
	"origin" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linkEvent" ADD CONSTRAINT "linkEvent_linkId_link_id_fk" FOREIGN KEY ("linkId") REFERENCES "public"."link"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_links_user_id" ON "link" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_links_slug" ON "link" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_link_events_link_id" ON "linkEvent" USING btree ("linkId");--> statement-breakpoint
CREATE INDEX "idx_link_events_created_at" ON "linkEvent" USING btree ("createdAt");