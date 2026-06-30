package handler

import (
	"encoding/json"
	"net/http"

	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type registerRequest struct {
	Username   string `json:"username"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	VerifyCode string `json:"verify_code"`
}

type loginRequest struct {
	Account    string `json:"account"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`
}

type sendVerifyCodeRequest struct {
	Email string `json:"email"`
}

// Register 用户注册（注册即登录，返回 JWT token）
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	token, user, err := h.authService.Register(req.Username, req.Email, req.Password, req.VerifyCode)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":           user.ID,
			"username":     user.Username,
			"email":        user.Email,
			"nickname":     user.Nickname,
			"avatar_url":   user.AvatarURL,
			"bio":          user.Bio,
			"last_login_at": user.LastLoginAt,
		},
	})
}

// Login 用户登录
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	if req.Account == "" || req.Password == "" {
		response.BadRequest(w, "账号和密码不能为空")
		return
	}

	token, user, err := h.authService.Login(req.Account, req.Password, req.RememberMe)
	if err != nil {
		response.Unauthorized(w, err.Error())
		return
	}

	response.Success(w, map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":           user.ID,
			"username":     user.Username,
			"email":        user.Email,
			"nickname":     user.Nickname,
			"avatar_url":   user.AvatarURL,
			"bio":          user.Bio,
			"last_login_at": user.LastLoginAt,
		},
	})
}

// SendVerifyCode 发送邮箱验证码
func (h *AuthHandler) SendVerifyCode(w http.ResponseWriter, r *http.Request) {
	var req sendVerifyCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "请求格式错误")
		return
	}

	if req.Email == "" {
		response.BadRequest(w, "邮箱不能为空")
		return
	}

	data, err := h.authService.SendVerifyCode(req.Email)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Success(w, data)
}
