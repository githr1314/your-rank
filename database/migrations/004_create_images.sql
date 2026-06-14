-- 004_create_images.sql
-- 图片表：管理上传的图片及其多尺寸缩略图

CREATE TABLE images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_url  VARCHAR(500) NOT NULL,           -- 原图路径
    thumb_s_url VARCHAR(500) NOT NULL DEFAULT '', -- 200px 缩略图
    thumb_m_url VARCHAR(500) NOT NULL DEFAULT '', -- 800px 缩略图
    file_size   INT          NOT NULL DEFAULT 0,  -- 字节
    mime_type   VARCHAR(50)  NOT NULL DEFAULT '',
    width       INT          NOT NULL DEFAULT 0,
    height      INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_user_id ON images(user_id);
