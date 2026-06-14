package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Ranking struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Title       string         `gorm:"size:100;not null" json:"title"`
	Description string         `gorm:"type:text;default:''" json:"description"`
	CoverURL    string         `gorm:"size:500;default:''" json:"cover_url"`
	Category    string         `gorm:"size:20;default:'其他'" json:"category"`
	Visibility  string         `gorm:"size:10;default:'公开'" json:"visibility"`
	ShareCode   string         `gorm:"size:8;uniqueIndex;not null" json:"share_code"`
	ViewCount   int            `gorm:"default:0" json:"view_count"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	// 关联
	Entries []Entry `gorm:"foreignKey:RankingID" json:"entries,omitempty"`
	User    *User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Ranking) TableName() string { return "rankings" }
