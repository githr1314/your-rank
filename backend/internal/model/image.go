package model

import (
	"time"

	"github.com/google/uuid"
)

type Image struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	OriginURL string    `gorm:"size:500;not null" json:"origin_url"`
	ThumbSURL string    `gorm:"size:500;default:''" json:"thumb_s_url"`
	ThumbMURL string    `gorm:"size:500;default:''" json:"thumb_m_url"`
	FileSize  int       `gorm:"default:0" json:"file_size"`
	MimeType  string    `gorm:"size:50;default:''" json:"mime_type"`
	Width     int       `gorm:"default:0" json:"width"`
	Height    int       `gorm:"default:0" json:"height"`
	CreatedAt time.Time `json:"created_at"`
}

func (Image) TableName() string { return "images" }
