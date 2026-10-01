CREATE TABLE "shop_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_name" text DEFAULT 'Sugandhit Studio' NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"currency_symbol" text DEFAULT 'रू' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kathmandu' NOT NULL,
	"footer_text" text DEFAULT '' NOT NULL,
	"currency_format" text DEFAULT 'ne-NP' NOT NULL,
	"updated_at" bigint NOT NULL
);
