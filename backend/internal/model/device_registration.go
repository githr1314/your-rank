package model

import (
	"time"

	"github.com/google/uuid"
)

// DeviceRegistration 设备注册记录（用于注册限流）
type DeviceRegistration struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DeviceID  string    `gorm:"size:64;not null" json:"device_id"`
	IPAddress string    `gorm:"type:inet;not null" json:"ip_address"`
	CreatedAt time.Time `json:"created_at"`
}

func (DeviceRegistration) TableName() string { return "device_registrations" }
