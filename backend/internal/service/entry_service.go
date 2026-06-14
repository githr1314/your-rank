package service

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/model"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/pkg/validator"
)

type EntryService struct {
	entryRepo   *repository.EntryRepo
	rankingRepo *repository.RankingRepo
}

func NewEntryService(entryRepo *repository.EntryRepo, rankingRepo *repository.RankingRepo) *EntryService {
	return &EntryService{entryRepo: entryRepo, rankingRepo: rankingRepo}
}

var validTiers = map[string]bool{"S": true, "A": true, "B": true, "C": true, "D": true}

// CreateEntry 创建条目（默认进入待放置区）
func (s *EntryService) CreateEntry(rankingID, userID uuid.UUID, name, description, imageURL, linkURL string) (*model.Entry, error) {
	// 校验排行榜所有权
	ranking, err := s.rankingRepo.FindByID(rankingID)
	if err != nil {
		return nil, errors.New("排行榜不存在")
	}
	if ranking.UserID != userID {
		return nil, errors.New("无权操作此排行榜")
	}

	// 条目数上限检查
	count, _ := s.entryRepo.CountByRankingID(rankingID)
	if count >= 100 {
		return nil, errors.New("排行榜条目已达上限（100条）")
	}

	name = validator.SanitizeString(name, 200)
	if name == "" {
		return nil, errors.New("条目名称不能为空")
	}

	entry := &model.Entry{
		ID:          uuid.New(),
		RankingID:   rankingID,
		Name:        name,
		Description: validator.SanitizeString(description, 500),
		ImageURL:    imageURL,
		LinkURL:     linkURL,
		Tier:        nil, // 待放置
		SortOrder:   int(count),
	}

	if err := s.entryRepo.Create(entry); err != nil {
		return nil, fmt.Errorf("创建条目失败: %w", err)
	}

	return entry, nil
}

// UpdateEntry 更新条目
func (s *EntryService) UpdateEntry(id, userID uuid.UUID, name, description, imageURL, linkURL string) (*model.Entry, error) {
	entry, err := s.entryRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("条目不存在")
	}

	// 校验排行榜所有权
	ranking, _ := s.rankingRepo.FindByID(entry.RankingID)
	if ranking == nil || ranking.UserID != userID {
		return nil, errors.New("无权操作此条目")
	}

	name = validator.SanitizeString(name, 200)
	if name != "" {
		entry.Name = name
	}
	entry.Description = validator.SanitizeString(description, 500)
	if imageURL != "" {
		entry.ImageURL = imageURL
	}
	entry.LinkURL = linkURL

	if err := s.entryRepo.Update(entry); err != nil {
		return nil, fmt.Errorf("更新条目失败: %w", err)
	}

	return entry, nil
}

// DeleteEntry 删除条目
func (s *EntryService) DeleteEntry(id, userID uuid.UUID) error {
	entry, err := s.entryRepo.FindByID(id)
	if err != nil {
		return errors.New("条目不存在")
	}

	ranking, _ := s.rankingRepo.FindByID(entry.RankingID)
	if ranking == nil || ranking.UserID != userID {
		return errors.New("无权操作此条目")
	}

	return s.entryRepo.SoftDelete(id)
}

// UpdateEntryTier 更新单个条目的等级和排序位置
func (s *EntryService) UpdateEntryTier(id, userID uuid.UUID, tier *string, sortOrder int) (*model.Entry, error) {
	entry, err := s.entryRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("条目不存在")
	}

	ranking, _ := s.rankingRepo.FindByID(entry.RankingID)
	if ranking == nil || ranking.UserID != userID {
		return nil, errors.New("无权操作此条目")
	}

	if tier != nil && !validTiers[*tier] {
		return nil, fmt.Errorf("无效的等级: %s", *tier)
	}

	entry.Tier = tier
	entry.SortOrder = sortOrder

	if err := s.entryRepo.Update(entry); err != nil {
		return nil, fmt.Errorf("更新条目等级失败: %w", err)
	}

	return entry, nil
}

// BatchReorderEntries 批量更新条目顺序（拖拽后保存）
func (s *EntryService) BatchReorderEntries(userID uuid.UUID, updates []struct {
	ID        uuid.UUID
	Tier      *string
	SortOrder int
}) error {
	if len(updates) == 0 {
		return nil
	}

	// 取第一条验证权限
	first, err := s.entryRepo.FindByID(updates[0].ID)
	if err != nil {
		return err
	}
	ranking, _ := s.rankingRepo.FindByID(first.RankingID)
	if ranking == nil || ranking.UserID != userID {
		return errors.New("无权操作")
	}

	entries := make([]model.Entry, len(updates))
	for i, u := range updates {
		entries[i] = model.Entry{
			ID:        u.ID,
			Tier:      u.Tier,
			SortOrder: u.SortOrder,
		}
	}

	return s.entryRepo.BatchUpdateTiers(entries)
}
