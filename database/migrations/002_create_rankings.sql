-- 002_create_rankings.sql
-- 排行榜表：Tier List 核心实体

CREATE TABLE rankings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    cover_url   VARCHAR(500) NOT NULL DEFAULT '',
    category    VARCHAR(20)  NOT NULL DEFAULT '其他',   -- 游戏/影视/音乐/美食/运动/科技/其他
    visibility  VARCHAR(10)  NOT NULL DEFAULT '公开',   -- 公开/私密/仅链接
    share_code  VARCHAR(8)   NOT NULL UNIQUE,            -- 8位分享码
    view_count  INT          NOT NULL DEFAULT 0,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rankings_user_id    ON rankings(user_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_rankings_visibility ON rankings(visibility) WHERE deleted_at IS NULL;
CREATE INDEX idx_rankings_share_code ON rankings(share_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_rankings_category   ON rankings(category)   WHERE deleted_at IS NULL;
CREATE INDEX idx_rankings_created_at ON rankings(created_at DESC) WHERE deleted_at IS NULL;
