-- 设备注册限流表
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS device_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL,
    ip_address INET NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_reg_device ON device_registrations(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_reg_ip ON device_registrations(ip_address, created_at DESC);
