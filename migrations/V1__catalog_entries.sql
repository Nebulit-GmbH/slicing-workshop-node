CREATE TABLE IF NOT EXISTS "public"."catalog_entries"
(
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
