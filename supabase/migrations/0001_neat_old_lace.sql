CREATE TABLE IF NOT EXISTS "usage_limits" (
	"identity_hash" text NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_limits_identity_hash_day_pk" PRIMARY KEY("identity_hash","day")
);

alter table public.usage_limits enable row level security;

revoke select, insert, update, delete on public.usage_limits from anon, authenticated;
