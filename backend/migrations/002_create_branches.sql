-- Up Migration

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INT DEFAULT 100,
    work_start TIME NOT NULL,
    work_end TIME NOT NULL,
    late_tolerance_minutes INT DEFAULT 15,
    work_days VARCHAR[] DEFAULT '{Mon,Tue,Wed,Thu,Fri}',
    require_selfie BOOL DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    is_active BOOL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to users table
ALTER TABLE users ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Down Migration
-- ALTER TABLE users DROP CONSTRAINT fk_users_branch;
-- DROP TABLE branches;
