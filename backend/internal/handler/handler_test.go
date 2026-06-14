package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/handler"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// setupTestDB 连接测试数据库（如不可用则跳过）
func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	cfg := config.Load()
	// 如果测试数据库不可用则跳过
	dsn := "host=" + cfg.DBHost + " port=" + cfg.DBPort +
		" user=" + cfg.DBUser + " password=" + cfg.DBPassword +
		" dbname=" + cfg.DBName + " sslmode=disable TimeZone=Asia/Shanghai"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("跳过需要数据库的测试: %v", err)
	}
	return db
}

// TestSendVerifyCodeHandler 测试发送验证码接口
func TestSendVerifyCodeHandler(t *testing.T) {
	db := setupTestDB(t)
	cfg := config.Load()

	userRepo := repository.NewUserRepo(db)
	authService := service.NewAuthService(userRepo, cfg, db)
	authHandler := handler.NewAuthHandler(authService)

	// 创建测试请求
	body := `{"email":"test@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/send-verify-code",
		strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Device-ID", "test-device")

	w := httptest.NewRecorder()
	authHandler.SendVerifyCode(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusTooManyRequests {
		t.Errorf("期望状态码 200 或 429，得到 %d", resp.StatusCode)
	}

	var apiResp response.APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		t.Fatalf("解析响应失败: %v", err)
	}
	if apiResp.Code == http.StatusOK && apiResp.Data == nil {
		t.Error("成功响应 data 不应为 nil")
	}
}

// TestProfileUpdateHandler 测试更新个人资料接口
func TestProfileUpdateHandler(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepo(db)
	profileService := service.NewProfileService(userRepo, db)
	profileHandler := handler.NewProfileHandler(profileService)

	// 这个测试需要 JWT token，这里只测试请求格式错误的情况
	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/profile",
		strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	profileHandler.UpdateProfile(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("期望状态码 400，得到 %d", resp.StatusCode)
	}
}

// TestProfilePasswordHandler 测试修改密码接口
func TestProfilePasswordHandler(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepo(db)
	profileService := service.NewProfileService(userRepo, db)
	profileHandler := handler.NewProfileHandler(profileService)

	// 测试空密码情况
	body := `{"old_password":"","new_password":""}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/profile/password",
		strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	profileHandler.UpdatePassword(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("期望状态码 400，得到 %d", resp.StatusCode)
	}
}

// TestProfileDeleteHandler 测试注销账号接口
func TestProfileDeleteHandler(t *testing.T) {
	db := setupTestDB(t)

	userRepo := repository.NewUserRepo(db)
	profileService := service.NewProfileService(userRepo, db)
	profileHandler := handler.NewProfileHandler(profileService)

	// 测试无 confirm 字段
	body := `{}`
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/profile",
		strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	profileHandler.DeleteAccount(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("期望状态码 400，得到 %d", resp.StatusCode)
	}
}
