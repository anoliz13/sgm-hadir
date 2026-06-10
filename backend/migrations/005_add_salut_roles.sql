-- Up Migration
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kepala_salut';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manajer_salut';

-- Down Migration
-- PostgreSQL doesn't support removing enum values easily without dropping and recreating the type.
