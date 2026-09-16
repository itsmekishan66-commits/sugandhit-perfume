CREATE TABLE "accounting_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" bigint NOT NULL,
	"end_date" bigint NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_by" integer,
	"closed_at" bigint,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_payable" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"bill_ref" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"bill_date" bigint NOT NULL,
	"due_date" bigint NOT NULL,
	"original_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"approved_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_payable_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payable_id" integer NOT NULL,
	"payment_account_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"paid_at" bigint NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"order_id" integer,
	"custom_order_id" integer,
	"invoice_ref" text DEFAULT '' NOT NULL,
	"invoice_date" bigint NOT NULL,
	"due_date" bigint NOT NULL,
	"original_amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit_applied" numeric(12, 2) DEFAULT '0' NOT NULL,
	"refund_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"outstanding_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"write_off_reason" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"receivable_id" integer NOT NULL,
	"payment_transaction_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"applied_at" bigint NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"actor_role" text DEFAULT '' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"previous_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"new_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cartitems" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" text NOT NULL,
	"size" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cartitems_user_product_size_unique" UNIQUE("user_id","product_id","size")
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"normal_balance" text DEFAULT 'debit' NOT NULL,
	"parent_id" integer,
	"description" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "chart_of_accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"min_purchase" numeric(12, 2) DEFAULT '0' NOT NULL,
	"max_discount" numeric(12, 2),
	"valid_from" bigint NOT NULL,
	"valid_till" bigint NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
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
CREATE TABLE "expense_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" bigint NOT NULL,
	"vendor_id" integer,
	"vendor_name" text DEFAULT '' NOT NULL,
	"account_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"payment_account_id" integer,
	"due_date" bigint,
	"description" text DEFAULT '' NOT NULL,
	"attachment" text DEFAULT '' NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"created_by" integer,
	"approved_by" integer,
	"journal_entry_id" integer,
	"payment_journal_entry_id" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" bigint NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"account_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_account_id" integer,
	"reference" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"journal_entry_id" integer,
	"created_by" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"change" integer NOT NULL,
	"type" text NOT NULL,
	"reference_id" text DEFAULT '' NOT NULL,
	"qty_before" integer NOT NULL,
	"qty_after" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_number" text NOT NULL,
	"entry_date" bigint NOT NULL,
	"posting_date" bigint,
	"reference_type" text DEFAULT '' NOT NULL,
	"reference_id" integer,
	"description" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reversal_of_id" integer,
	"created_by" integer,
	"approved_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"debit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cost_center" text DEFAULT '' NOT NULL,
	"tax_info" jsonb DEFAULT '{}'::jsonb NOT NULL
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
CREATE TABLE "notificationreads" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	CONSTRAINT "notificationreads_notification_user_unique" UNIQUE("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL
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
CREATE TABLE "payment_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"provider" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"branch" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_provider_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"transaction_id" text DEFAULT '' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" bigint,
	"created_at" bigint NOT NULL,
	CONSTRAINT "payment_provider_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "payment_reconciliation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"reconciliation_id" integer NOT NULL,
	"transaction_id" integer,
	"external_ref" text DEFAULT '' NOT NULL,
	"external_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"matched" boolean DEFAULT false NOT NULL,
	"match_type" text DEFAULT '' NOT NULL,
	"discrepancy" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'unmatched' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_reconciliations" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_account_id" integer NOT NULL,
	"period_start" bigint NOT NULL,
	"period_end" bigint NOT NULL,
	"opening_external_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"closing_external_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL,
	"locked_at" bigint
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer NOT NULL,
	"refund_ref" text DEFAULT '' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'full_refund' NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"chargeback" boolean DEFAULT false NOT NULL,
	"initiated_by" integer,
	"approved_by" integer,
	"journal_entry_id" integer,
	"created_at" bigint NOT NULL,
	"processed_at" bigint
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"provider_transaction_id" text DEFAULT '' NOT NULL,
	"order_id" integer,
	"custom_order_id" integer,
	"invoice_ref" text DEFAULT '' NOT NULL,
	"customer_id" integer,
	"customer_name" text DEFAULT '' NOT NULL,
	"payment_account_id" integer,
	"channel" text NOT NULL,
	"payment_method" text DEFAULT '' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"processing_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"intent" text DEFAULT '' NOT NULL,
	"transaction_type" text DEFAULT 'payment' NOT NULL,
	"initiated_at" bigint NOT NULL,
	"completed_at" bigint,
	"settlement_at" bigint,
	"failure_reason" text DEFAULT '' NOT NULL,
	"refund_ref" text DEFAULT '' NOT NULL,
	"reconciliation_status" text DEFAULT 'unreconciled' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"audit" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
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
	"sku" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"bestseller" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '4.5',
	"reviews" integer DEFAULT 0,
	"badge" text,
	"date" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"reorder_level" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_date" bigint NOT NULL,
	"expected_date" bigint,
	"received_date" bigint,
	"status" text DEFAULT 'ordered' NOT NULL,
	"sub_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"phone" text DEFAULT '',
	"address" jsonb DEFAULT '{}'::jsonb,
	"image" text DEFAULT '',
	"credit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlistitems" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "wishlistitems_user_product_unique" UNIQUE("user_id","product_id")
);
