-- Up Migration

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    notes TEXT,
    check_in_lat DOUBLE PRECISION NOT NULL,
    check_in_lng DOUBLE PRECISION NOT NULL,
    check_in_selfie_url VARCHAR(255) NOT NULL,
    check_in_at TIMESTAMPTZ NOT NULL,
    check_out_lat DOUBLE PRECISION,
    check_out_lng DOUBLE PRECISION,
    check_out_at TIMESTAMPTZ,
    is_verified BOOL DEFAULT false,
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_visits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_visits_verifier FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Down Migration
-- DROP TABLE visits;
