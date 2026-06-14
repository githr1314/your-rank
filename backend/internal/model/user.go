package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Username           string         `gorm:"size:20;uniqueIndex;not null" json:"username"`
	Email              string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	Password           string         `gorm:"size:255;not null" json:"-"`
	Nickname           string         `gorm:"size:50;default:''" json:"nickname"`
	AvatarURL          string         `gorm:"size:500;default:''" json:"avatar_url"`
	Bio                string         `gorm:"size:500;default:''" json:"bio"`
	EmailVerified      bool           `gorm:"default:false" json:"email_verified"`
	VerifyCode         *string        `gorm:"size:6" json:"-"`
	VerifyCodeExpire   *time.Time     `json:"-"`
	VerifyCodeAttempts int            `gorm:"default:0" json:"-"`
	LoginFailCount     int            `gorm:"default:0" json:"-"`
	LockedUntil        *time.Time     `json:"-"`
	LastLoginAt        *time.Time     `json:"last_login_at"`
	LastLoginIP        *string        `json:"-"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
}

func (User) TableName() string { return "users" }
