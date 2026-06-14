-- 001_create_users.sql
-- 用户表：账号体系核心

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(20)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,          -- bcrypt hash
    nickname    VARCHAR(50)  NOT NULL DEFAULT '',
    avatar_url  VARCHAR(500) NOT NULL DEFAULT '',
    bio         VARCHAR(500) NOT NULL DEFAULT '',

    -- 验证相关
    email_verified       BOOLEAN   NOT NULL DEFAULT FALSE,
    verify_code          VARCHAR(6),
    verify_code_expire   TIMESTAMPTZ,
    verify_code_attempts INT       NOT NULL DEFAULT 0,

    -- 登录安全
    login_fail_count     INT       NOT NULL DEFAULT 0,
    locked_until         TIMESTAMPTZ,
    last_login_at        TIMESTAMPTZ,
    last_login_ip        INET,

    -- 软删除
    deleted_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_email  ON users(email)  WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
