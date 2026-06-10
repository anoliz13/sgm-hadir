-- Up Migration

CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    requires_document BOOL DEFAULT false,
    deducts_quota BOOL DEFAULT true,
    max_days_per_year INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    leave_type_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    attachment_url VARCHAR(255),
    status leave_status DEFAULT 'pending',
    approver_id UUID,
    approver_note TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_requests_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_leave_requests_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Down Migration
-- DROP TABLE leave_requests;
-- DROP TABLE leave_types;
-- DROP TYPE leave_status;
