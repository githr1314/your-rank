package service

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/model"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/pkg/validator"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ProfileService struct {
	userRepo *repository.UserRepo
	db       *gorm.DB
}

func NewProfileService(userRepo *repository.UserRepo, db *gorm.DB) *ProfileService {
	return &ProfileService{userRepo: userRepo, db: db}
}

// UpdateProfile 更新个人资料（昵称、简介、头像）
func (s *ProfileService) UpdateProfile(userID uuid.UUID, nickname, bio, avatarURL string) (*model.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	if nickname != "" {
		nickname = validator.SanitizeString(nickname, 50)
		user.Nickname = nickname
	}
	user.Bio = validator.SanitizeString(bio, 500)
	if avatarURL != "" {
		user.AvatarURL = validator.SanitizeString(avatarURL, 500)
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, fmt.Errorf("更新资料失败: %w", err)
	}

	return user, nil
}

// UpdatePassword 修改密码
func (s *ProfileService) UpdatePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("用户不存在")
	}

	// 验证旧密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("旧密码错误")
	}

	// bcrypt 新密码
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("密码加密失败: %w", err)
	}

	user.Password = string(hashed)
	return s.userRepo.Update(user)
}

// DeleteAccount 注销账号（级联软删除用户及其所有数据）
func (s *ProfileService) DeleteAccount(userID uuid.UUID, confirm bool) error {
	if !confirm {
		return errors.New("请确认注销操作")
	}

	// 使用事务级联软删除
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 获取用户的所有排行榜ID
		var rankings []model.Ranking
		if err := tx.Select("id").Where("user_id = ? AND deleted_at IS NULL", userID).Find(&rankings).Error; err != nil {
			return fmt.Errorf("查询排行榜失败: %w", err)
		}

		// 级联软删除所有条目
		for _, ranking := range rankings {
			if err := tx.Where("ranking_id = ?", ranking.ID).Delete(&model.Entry{}).Error; err != nil {
				return fmt.Errorf("删除条目失败: %w", err)
			}
		}

		// 软删除所有排行榜
		if err := tx.Where("user_id = ?", userID).Delete(&model.Ranking{}).Error; err != nil {
			return fmt.Errorf("删除排行榜失败: %w", err)
		}

		// 软删除用户
		if err := tx.Delete(&model.User{}, "id = ?", userID).Error; err != nil {
			return fmt.Errorf("删除用户失败: %w", err)
		}

		return nil
	})
}
