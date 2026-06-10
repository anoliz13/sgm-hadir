-- Up Migration

-- Create custom ENUM types
CREATE TYPE user_role AS ENUM ('super_admin', 'supervisor', 'employee');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    photo_url VARCHAR(255),
    position VARCHAR(255),
    division VARCHAR(255),
    branch_id UUID,
    phone VARCHAR(50),
    email VARCHAR(255),
    annual_leave_quota INT DEFAULT 12,
    annual_leave_used INT DEFAULT 0,
    is_active BOOL DEFAULT true,
    joined_at DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
-- DROP TABLE users;
-- DROP TYPE user_role;
