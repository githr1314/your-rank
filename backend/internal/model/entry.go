package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Entry struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	RankingID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"ranking_id"`
	Name        string         `gorm:"size:200;not null" json:"name"`
	Description string         `gorm:"type:text;default:''" json:"description"`
	ImageURL    string         `gorm:"size:500;default:''" json:"image_url"`
	LinkURL     string         `gorm:"size:500;default:''" json:"link_url"`
	Tier        *string        `gorm:"size:2" json:"tier"` // S/A/B/C/D, nil=待放置
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	Ranking *Ranking `gorm:"foreignKey:RankingID" json:"ranking,omitempty"`
}

func (Entry) TableName() string { return "entries" }
