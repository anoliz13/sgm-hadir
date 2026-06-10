-- Up Migration

CREATE TYPE attendance_type AS ENUM ('check_in', 'check_out', 'overtime_in', 'overtime_out', 'visit_in', 'visit_out');
CREATE TYPE attendance_status AS ENUM ('on_time', 'late', 'early_leave', 'half_day');

CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    type attendance_type NOT NULL,
    status attendance_status,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    gps_accuracy FLOAT,
    distance_from_branch FLOAT,
    selfie_url VARCHAR(255),
    notes TEXT,
    is_manual_entry BOOL DEFAULT false,
    manual_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendances_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendances_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Index for querying attendances by user and date quickly
CREATE INDEX idx_attendances_user_id_created_at ON attendances (user_id, created_at);
CREATE INDEX idx_attendances_branch_id_created_at ON attendances (branch_id, created_at);

-- Down Migration
-- DROP TABLE attendances;
-- DROP TYPE attendance_status;
-- DROP TYPE attendance_type;
