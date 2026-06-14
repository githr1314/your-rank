package repository

import (
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/model"
	"gorm.io/gorm"
)

type EntryRepo struct {
	db *gorm.DB
}

func NewEntryRepo(db *gorm.DB) *EntryRepo {
	return &EntryRepo{db: db}
}

func (r *EntryRepo) Create(entry *model.Entry) error {
	return r.db.Create(entry).Error
}

func (r *EntryRepo) FindByID(id uuid.UUID) (*model.Entry, error) {
	var entry model.Entry
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&entry).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

func (r *EntryRepo) FindByRankingID(rankingID uuid.UUID) ([]model.Entry, error) {
	var entries []model.Entry
	err := r.db.Where("ranking_id = ? AND deleted_at IS NULL", rankingID).
		Order("tier ASC, sort_order ASC").Find(&entries).Error
	return entries, err
}

func (r *EntryRepo) Update(entry *model.Entry) error {
	return r.db.Save(entry).Error
}

// BatchUpdateTiers 批量更新条目的等级和排序
func (r *EntryRepo) BatchUpdateTiers(entries []model.Entry) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, e := range entries {
			if err := tx.Model(&model.Entry{}).Where("id = ?", e.ID).
				Updates(map[string]interface{}{
					"tier":       e.Tier,
					"sort_order": e.SortOrder,
				}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *EntryRepo) SoftDelete(id uuid.UUID) error {
	return r.db.Delete(&model.Entry{}, "id = ?", id).Error
}

// CountByRankingID 统计某排行榜的条目数
func (r *EntryRepo) CountByRankingID(rankingID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.Entry{}).
		Where("ranking_id = ? AND deleted_at IS NULL", rankingID).Count(&count).Error
	return count, err
}
