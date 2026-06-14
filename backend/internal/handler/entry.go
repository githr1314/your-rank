package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/middleware"
	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"
)

type EntryHandler struct {
	entryService *service.EntryService
}

func NewEntryHandler(entryService *service.EntryService) *EntryHandler {
	return &EntryHandler{entryService: entryService}
}

type createEntryRequest struct {
	RankingID   string `json:"ranking_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	LinkURL     string `json:"link_url"`
}

// Create 创建条目
func (h *EntryHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req createEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	rankingID, err := uuid.Parse(req.RankingID)
	if err != nil {
		response.BadRequest(w, "无效的排行榜ID")
		return
	}

	entry, err := h.entryService.CreateEntry(rankingID, userID, req.Name, req.Description, req.ImageURL, req.LinkURL)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, entry)
}

// Update 更新条目
func (h *EntryHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(w, "无效的条目ID")
		return
	}

	var req createEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	entry, err := h.entryService.UpdateEntry(id, userID, req.Name, req.Description, req.ImageURL, req.LinkURL)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, entry)
}

// Delete 删除条目
func (h *EntryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.BadRequest(w, "无效的条目ID")
		return
	}

	if err := h.entryService.DeleteEntry(id, userID); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]string{"message": "已删除"})
}

type reorderRequest struct {
	Updates []struct {
		ID        string  `json:"id"`
		Tier      *string `json:"tier"`
		SortOrder int     `json:"sort_order"`
	} `json:"updates"`
}

// Reorder 批量更新条目顺序（拖拽保存）
func (h *EntryHandler) Reorder(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req reorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	updates := make([]struct {
		ID        uuid.UUID
		Tier      *string
		SortOrder int
	}, len(req.Updates))

	for i, u := range req.Updates {
		id, err := uuid.Parse(u.ID)
		if err != nil {
			response.BadRequest(w, "无效的条目ID")
			return
		}
		updates[i] = struct {
			ID        uuid.UUID
			Tier      *string
			SortOrder int
		}{ID: id, Tier: u.Tier, SortOrder: u.SortOrder}
	}

	if err := h.entryService.BatchReorderEntries(userID, updates); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]string{"message": "已保存"})
}
