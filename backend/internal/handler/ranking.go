package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/middleware"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"
)

type RankingHandler struct {
	rankingService *service.RankingService
	rankingRepo    *repository.RankingRepo
}

func NewRankingHandler(rankingService *service.RankingService, rankingRepo *repository.RankingRepo) *RankingHandler {
	return &RankingHandler{rankingService: rankingService, rankingRepo: rankingRepo}
}

type createRankingRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
	Category    string `json:"category"`
	Visibility  string `json:"visibility"`
}

// Create 创建排行榜
func (h *RankingHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req createRankingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	ranking, err := h.rankingService.CreateRanking(userID, req.Title, req.Description, req.CoverURL, req.Category, req.Visibility)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, ranking)
}

// Get 获取排行榜详情
func (h *RankingHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(w, "无效的排行榜ID")
		return
	}

	ranking, err := h.rankingService.GetRanking(id)
	if err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, ranking)
}

// Update 更新排行榜
func (h *RankingHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(w, "无效的排行榜ID")
		return
	}

	var req createRankingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	ranking, err := h.rankingService.UpdateRanking(id, userID, req.Title, req.Description, req.CoverURL, req.Category, req.Visibility)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, ranking)
}

// Delete 删除排行榜
func (h *RankingHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(w, "无效的排行榜ID")
		return
	}

	if err := h.rankingService.DeleteRanking(id, userID); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]string{"message": "已删除"})
}

// ListMy 我的排行榜列表
func (h *RankingHandler) ListMy(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	rankings, total, err := h.rankingRepo.FindByUserID(userID, offset, limit)
	if err != nil {
		response.InternalError(w, "获取排行榜列表失败")
		return
	}

	response.Success(w, map[string]interface{}{
		"items": rankings,
		"total": total,
	})
}

// ListPublic 公开排行榜列表（发现页）
func (h *RankingHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	category := r.URL.Query().Get("category")
	keyword := r.URL.Query().Get("keyword")
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	rankings, total, err := h.rankingRepo.FindPublic(offset, limit, category, keyword)
	if err != nil {
		response.InternalError(w, "获取排行榜列表失败")
		return
	}

	response.Success(w, map[string]interface{}{
		"items": rankings,
		"total": total,
	})
}

// GetByShareCode 通过分享码获取
func (h *RankingHandler) GetByShareCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if len(code) != 8 {
		response.BadRequest(w, "无效的分享码")
		return
	}

	ranking, err := h.rankingService.GetRankingByShareCode(code)
	if err != nil {
		response.NotFound(w, err.Error())
		return
	}

	response.Success(w, ranking)
}
