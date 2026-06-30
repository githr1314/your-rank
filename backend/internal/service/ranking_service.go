package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/model"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/pkg/validator"
)

type RankingService struct {
	rankingRepo *repository.RankingRepo
	entryRepo   *repository.EntryRepo
}

func NewRankingService(rankingRepo *repository.RankingRepo, entryRepo *repository.EntryRepo) *RankingService {
	return &RankingService{rankingRepo: rankingRepo, entryRepo: entryRepo}
}

var validCategories = map[string]bool{
	"游戏": true, "影视": true, "音乐": true, "美食": true,
	"运动": true, "科技": true, "其他": true,
}
var validVisibilities = map[string]bool{
	"公开": true, "私密": true, "仅链接": true,
}

// CreateRanking 创建排行榜
func (s *RankingService) CreateRanking(userID uuid.UUID, title, description, coverURL, category, visibility string) (*model.Ranking, error) {
	title = validator.SanitizeString(title, 100)
	if title == "" {
		return nil, errors.New("排行榜标题不能为空")
	}

	if !validCategories[category] {
		category = "其他"
	}
	if !validVisibilities[visibility] {
		visibility = "公开"
	}

	shareCode, err := generateShareCode(8)
	if err != nil {
		return nil, fmt.Errorf("生成分享码失败: %w", err)
	}

	ranking := &model.Ranking{
		ID:          uuid.New(),
		UserID:      userID,
		Title:       title,
		Description: description,
		CoverURL:    coverURL,
		Category:    category,
		Visibility:  visibility,
		ShareCode:   shareCode,
	}

	if err := s.rankingRepo.Create(ranking); err != nil {
		return nil, fmt.Errorf("创建排行失败: %w", err)
	}

	return ranking, nil
}

// UpdateRanking 更新排行榜信息
func (s *RankingService) UpdateRanking(id, userID uuid.UUID, title, description, coverURL, category, visibility string) (*model.Ranking, error) {
	ranking, err := s.rankingRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("排行榜不存在")
	}
	if ranking.UserID != userID {
		return nil, errors.New("无权操作此排行榜")
	}

	title = validator.SanitizeString(title, 100)
	if title != "" {
		ranking.Title = title
	}
	ranking.Description = validator.SanitizeString(description, 2000)
	if coverURL != "" {
		ranking.CoverURL = validator.SanitizeString(coverURL, 500)
	}
	if validCategories[category] {
		ranking.Category = category
	}
	if validVisibilities[visibility] {
		ranking.Visibility = visibility
	}

	if err := s.rankingRepo.Update(ranking); err != nil {
		return nil, fmt.Errorf("更新排行失败: %w", err)
	}

	return ranking, nil
}

// DeleteRanking 删除排行榜（级联删除条目）
func (s *RankingService) DeleteRanking(id, userID uuid.UUID) error {
	ranking, err := s.rankingRepo.FindByID(id)
	if err != nil {
		return errors.New("排行榜不存在")
	}
	if ranking.UserID != userID {
		return errors.New("无权操作此排行榜")
	}

	// 先软删除所有条目
	entries, _ := s.entryRepo.FindByRankingID(id)
	for _, e := range entries {
		_ = s.entryRepo.SoftDelete(e.ID)
	}

	return s.rankingRepo.SoftDelete(id)
}

// GetRanking 获取排行榜详情（含可见性权限校验）
func (s *RankingService) GetRanking(id uuid.UUID, userID uuid.UUID) (*model.Ranking, error) {
	ranking, err := s.rankingRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("排行榜不存在")
	}
	// 可见性校验：私密排行仅创建者可查看
	if ranking.Visibility == "私密" && ranking.UserID != userID {
		return nil, errors.New("排行榜不存在")
	}
	// 异步增加浏览量（忽略错误）
	go func() { _ = s.rankingRepo.IncrementView(id) }()
	return ranking, nil
}

// GetRankingByShareCode 通过分享码获取
func (s *RankingService) GetRankingByShareCode(code string) (*model.Ranking, error) {
	ranking, err := s.rankingRepo.FindByShareCode(code)
	if err != nil {
		return nil, errors.New("分享链接无效")
	}
	go func() { _ = s.rankingRepo.IncrementView(ranking.ID) }()
	return ranking, nil
}

// generateShareCode 生成随机分享码
func generateShareCode(length int) (string, error) {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, length)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", err
		}
		result[i] = chars[n.Int64()]
	}
	return string(result), nil
}
