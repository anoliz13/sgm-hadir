-- Up Migration

CREATE TYPE overtime_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TABLE overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    date DATE NOT NULL,
    estimated_start TIME NOT NULL,
    estimated_end TIME NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    actual_hours FLOAT,
    reason TEXT,
    status overtime_status DEFAULT 'pending',
    approver_id UUID,
    approver_note TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_overtime_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_overtime_requests_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_overtime_requests_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Down Migration
-- DROP TABLE overtime_requests;
-- DROP TYPE overtime_status;
