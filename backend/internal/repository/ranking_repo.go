package repository

import (
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/model"
	"gorm.io/gorm"
)

type RankingRepo struct {
	db *gorm.DB
}

func NewRankingRepo(db *gorm.DB) *RankingRepo {
	return &RankingRepo{db: db}
}

func (r *RankingRepo) Create(ranking *model.Ranking) error {
	return r.db.Create(ranking).Error
}

func (r *RankingRepo) FindByID(id uuid.UUID) (*model.Ranking, error) {
	var ranking model.Ranking
	err := r.db.Preload("Entries", "deleted_at IS NULL").Where("id = ? AND deleted_at IS NULL", id).First(&ranking).Error
	if err != nil {
		return nil, err
	}
	return &ranking, nil
}

func (r *RankingRepo) FindByShareCode(code string) (*model.Ranking, error) {
	var ranking model.Ranking
	err := r.db.Preload("Entries", "deleted_at IS NULL AND tier IS NOT NULL").
		Where("share_code = ? AND deleted_at IS NULL", code).First(&ranking).Error
	if err != nil {
		return nil, err
	}
	return &ranking, nil
}

func (r *RankingRepo) FindByUserID(userID uuid.UUID, offset, limit int) ([]model.Ranking, int64, error) {
	var rankings []model.Ranking
	var total int64

	query := r.db.Model(&model.Ranking{}).Where("user_id = ? AND deleted_at IS NULL", userID)
	query.Count(&total)

	err := query.Order("updated_at DESC").Offset(offset).Limit(limit).Find(&rankings).Error
	return rankings, total, err
}

func (r *RankingRepo) FindPublic(offset, limit int, category string, keyword string) ([]model.Ranking, int64, error) {
	var rankings []model.Ranking
	var total int64

	query := r.db.Model(&model.Ranking{}).Where("visibility = ? AND deleted_at IS NULL", "公开")
	if category != "" && category != "全部" {
		query = query.Where("category = ?", category)
	}
	if keyword != "" {
		query = query.Where("title ILIKE ?", "%"+keyword+"%")
	}

	query.Count(&total)
	err := query.Order("updated_at DESC").Offset(offset).Limit(limit).Find(&rankings).Error
	return rankings, total, err
}

func (r *RankingRepo) Update(ranking *model.Ranking) error {
	return r.db.Save(ranking).Error
}

func (r *RankingRepo) IncrementView(id uuid.UUID) error {
	return r.db.Model(&model.Ranking{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *RankingRepo) SoftDelete(id uuid.UUID) error {
	return r.db.Delete(&model.Ranking{}, "id = ?", id).Error
}
