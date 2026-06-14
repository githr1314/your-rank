-- 003_create_entries.sql
-- 条目表：排行榜中的每个条目卡片

CREATE TABLE entries (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ranking_id  UUID         NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    image_url   VARCHAR(500) NOT NULL DEFAULT '',
    link_url    VARCHAR(500) NOT NULL DEFAULT '',

    -- 等级与排序
    tier        VARCHAR(2),              -- S/A/B/C/D，NULL 表示待放置
    sort_order  INT         NOT NULL DEFAULT 0,   -- 同等级内的排序

    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entries_ranking_id ON entries(ranking_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_entries_tier       ON entries(ranking_id, tier) WHERE deleted_at IS NULL;
