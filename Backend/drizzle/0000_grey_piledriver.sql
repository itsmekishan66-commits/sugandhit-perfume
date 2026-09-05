CREATE TABLE "customorders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text DEFAULT 'Custom Perfume' NOT NULL,
	"bottle_size" text DEFAULT '50ml' NOT NULL,
	"top_notes" jsonb NOT NULL,
	"heart_notes" jsonb NOT NULL,
	"base_notes" jsonb NOT NULL,
	"perfume_base" text NOT NULL,
	"strength" text DEFAULT 'EDP' NOT NULL,
	"strength_name" text DEFAULT 'Eau de Parfum' NOT NULL,
	"custom_label" text DEFAULT '' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'Order Placed' NOT NULL,
	"payment_method" text DEFAULT 'COD' NOT NULL,
	"payment" boolean DEFAULT false NOT NULL,
	"address" jsonb NOT NULL,
	"date" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"layer" text NOT NULL,
	"icon" text DEFAULT '🌿' NOT NULL,
	"color" text DEFAULT '#C586A5' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"items" jsonb NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"address" jsonb NOT NULL,
	"status" text DEFAULT 'Order Placed' NOT NULL,
	"payment_method" text NOT NULL,
	"payment" boolean DEFAULT false NOT NULL,
	"date" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfumebases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"extra_price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"image" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text NOT NULL,
	"sub_category" text NOT NULL,
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bestseller" boolean DEFAULT false,
	"date" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone" text DEFAULT '',
	"address" jsonb DEFAULT '{}'::jsonb,
	"cart_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
