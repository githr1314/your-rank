package handler

import (
	"encoding/json"
	"net/http"

	"github.com/yourrank/backend/internal/middleware"
	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"
	"github.com/yourrank/backend/pkg/validator"
)

type ProfileHandler struct {
	profileService *service.ProfileService
}

func NewProfileHandler(profileService *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{profileService: profileService}
}

type updateProfileRequest struct {
	Nickname  string `json:"nickname"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
}

// UpdateProfile 更新个人资料
func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	req.Nickname = validator.SanitizeString(req.Nickname, 50)
	req.Bio = validator.SanitizeString(req.Bio, 500)
	req.AvatarURL = validator.SanitizeString(req.AvatarURL, 500)

	user, err := h.profileService.UpdateProfile(userID, req.Nickname, req.Bio, req.AvatarURL)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"nickname":   user.Nickname,
		"bio":        user.Bio,
		"avatar_url": user.AvatarURL,
	})
}

type updatePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// UpdatePassword 修改密码
func (h *ProfileHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req updatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		response.BadRequest(w, "旧密码和新密码不能为空")
		return
	}

	if err := h.profileService.UpdatePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]string{"message": "密码修改成功"})
}

type deleteProfileRequest struct {
	Confirm bool `json:"confirm"`
}

// DeleteAccount 注销账号
func (h *ProfileHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	var req deleteProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	if err := h.profileService.DeleteAccount(userID, req.Confirm); err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, map[string]string{"message": "账号已注销"})
}
