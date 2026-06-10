-- Up Migration

CREATE TYPE holiday_type AS ENUM ('national', 'company');

CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL UNIQUE,
    type holiday_type NOT NULL DEFAULT 'national',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
-- DROP TABLE holidays;
-- DROP TYPE holiday_type;
