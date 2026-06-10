-- Up Migration

CREATE TABLE temp_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    branch_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_temp_assignments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_temp_assignments_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_temp_assignments_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- e.g., 'leave_request', 'overtime_request'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'approved', 'rejected'
    actor_id UUID NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Down Migration
-- DROP TABLE approval_logs;
-- DROP TABLE temp_assignments;
