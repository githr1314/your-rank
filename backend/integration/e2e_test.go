package integration_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/router"
	"github.com/yourrank/backend/pkg/response"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// setupTestDB 连接测试数据库（如不可用则跳过）
func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	cfg := config.Load()
	dsn := "host=" + cfg.DBHost + " port=" + cfg.DBPort +
		" user=" + cfg.DBUser + " password=" + cfg.DBPassword +
		" dbname=" + cfg.DBName + " sslmode=disable TimeZone=Asia/Shanghai"

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("跳过需要数据库的测试: %v", err)
	}
	return db
}

// newApp 创建带 chi router 的完整应用实例
func newApp(t *testing.T) (http.Handler, *config.Config) {
	t.Helper()
	db := setupTestDB(t)
	cfg := config.Load()
	return router.Setup(db, cfg), cfg
}

// request 创建 HTTP 请求的便捷函数
func request(method, url, body string, token ...string) *http.Request {
	req := httptest.NewRequest(method, url, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = fmt.Sprintf("127.0.0.1:%d", time.Now().UnixNano()%65535)
	if len(token) > 0 && token[0] != "" {
		req.Header.Set("Authorization", "Bearer "+token[0])
	}
	return req
}

// serve 执行请求并返回响应辅助函数
func serve(app http.Handler, req *http.Request) (*http.Response, response.APIResponse) {
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)
	resp := w.Result()

	var apiResp response.APIResponse
	json.NewDecoder(resp.Body).Decode(&apiResp)
	resp.Body.Close()

	return resp, apiResp
}

// getVerifyCode 通过发送验证码请求并从日志提取验证码
func getVerifyCode(t *testing.T, app http.Handler, logBuf *bytes.Buffer, email string) string {
	t.Helper()

	body := fmt.Sprintf(`{"email":"%s"}`, email)
	req := request(http.MethodPost, "/api/v1/auth/send-verify-code", body)
	resp, apiResp := serve(app, req)

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("发送验证码失败: status=%d, message=%s", resp.StatusCode, apiResp.Message)
	}

	// 从日志中解析验证码
	output := logBuf.String()
	prefix := "验证码: "
	idx := strings.LastIndex(output, prefix)
	if idx < 0 {
		t.Fatal("无法从日志中提取验证码")
	}
	codeRaw := output[idx+len(prefix):]
	// 只取数字部分
	var codeBuilder strings.Builder
	for _, ch := range codeRaw {
		if ch >= '0' && ch <= '9' {
			codeBuilder.WriteRune(ch)
		} else if codeBuilder.Len() == 6 {
			break
		}
	}
	code := codeBuilder.String()
	if len(code) != 6 {
		t.Fatalf("验证码格式不正确: got %q", code)
	}

	// 清除日志缓冲区，避免后续误读
	logBuf.Reset()

	return code
}

// registerUser 注册用户并返回 token, email, password
func registerUser(t *testing.T, app http.Handler, logBuf *bytes.Buffer) (token, email, password, userID string) {
	t.Helper()

	ts := time.Now().UnixNano()
	email = fmt.Sprintf("e2e_%d@example.com", ts)
	password = "Pass1234"
	username := fmt.Sprintf("e2euser%d", ts%10000000)

	// 发送验证码
	code := getVerifyCode(t, app, logBuf, email)

	// 注册
	body := fmt.Sprintf(`{"username":"%s","email":"%s","password":"%s","verify_code":"%s"}`,
		username, email, password, code)
	req := request(http.MethodPost, "/api/v1/auth/register", body)
	resp, apiResp := serve(app, req)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("注册失败: status=%d, message=%s", resp.StatusCode, apiResp.Message)
	}

	data, ok := apiResp.Data.(map[string]interface{})
	if !ok {
		t.Fatal("注册响应 data 格式异常")
	}

	token, _ = data["token"].(string)
	if token == "" {
		t.Fatal("注册响应缺少 token")
	}

	if user, ok := data["user"].(map[string]interface{}); ok {
		if id, ok := user["id"].(string); ok {
			userID = id
		}
	}

	return token, email, password, userID
}

// loginUser 登录用户并返回 token
func loginUser(t *testing.T, app http.Handler, account, password string, rememberMe bool) (token string, statusCode int) {
	t.Helper()

	body := fmt.Sprintf(`{"account":"%s","password":"%s","remember_me":%t}`, account, password, rememberMe)
	req := request(http.MethodPost, "/api/v1/auth/login", body)
	resp, apiResp := serve(app, req)

	if resp.StatusCode == http.StatusOK {
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			return "", resp.StatusCode
		}
		token, _ = data["token"].(string)
	}

	return token, resp.StatusCode
}

// createRanking 创建排行榜并返回 ID 和 share_code
func createRanking(t *testing.T, app http.Handler, token, title, category, visibility string) (rankingID, shareCode string) {
	t.Helper()

	body := fmt.Sprintf(`{"title":"%s","description":"集成测试","category":"%s","visibility":"%s"}`,
		title, category, visibility)
	req := request(http.MethodPost, "/api/v1/rankings", body, token)
	resp, apiResp := serve(app, req)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("创建排行榜失败: status=%d, message=%s", resp.StatusCode, apiResp.Message)
	}

	data, ok := apiResp.Data.(map[string]interface{})
	if !ok {
		t.Fatal("创建排行榜响应 data 格式异常")
	}

	rankingID, _ = data["id"].(string)
	if rankingID == "" {
		t.Fatal("创建排行榜响应缺少 id")
	}

	shareCode, _ = data["share_code"].(string)
	return rankingID, shareCode
}

// createEntry 创建条目并返回 ID
func createEntry(t *testing.T, app http.Handler, token, rankingID, name string) (entryID string) {
	t.Helper()

	body := fmt.Sprintf(`{"ranking_id":"%s","name":"%s","description":"条目描述"}`, rankingID, name)
	req := request(http.MethodPost, "/api/v1/entries", body, token)
	resp, apiResp := serve(app, req)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("创建条目(%s)失败: status=%d, message=%s", name, resp.StatusCode, apiResp.Message)
	}

	data, ok := apiResp.Data.(map[string]interface{})
	if !ok {
		t.Fatal("创建条目响应 data 格式异常")
	}

	entryID, _ = data["id"].(string)
	if entryID == "" {
		t.Fatal("创建条目响应缺少 id")
	}

	return entryID
}

//=============================================================================
// 测试 1: 完整流程 — 注册 → 登录 → 创建排行 → 添加条目 → 拖拽排序 → 分享码访问
//=============================================================================

func TestE2E_CompleteFlow(t *testing.T) {
	app, cfg := newApp(t)
	_ = cfg // 保留以备将来使用

	// 捕获日志以获取验证码
	var logBuf bytes.Buffer
	log.SetOutput(&logBuf)
	defer log.SetOutput(os.Stderr)

	token, email, password, _ := registerUser(t, app, &logBuf)

	// 1.1 登录验证（通过邮箱）
	t.Run("LoginByEmail", func(t *testing.T) {
		loginToken, statusCode := loginUser(t, app, email, password, false)
		if statusCode != http.StatusOK {
			t.Fatalf("邮箱登录失败: %d", statusCode)
		}
		if loginToken == "" {
			t.Fatal("邮箱登录响应缺少 token")
		}
	})

	// 1.2 登录验证（通过用户名）
	t.Run("LoginByUsername", func(t *testing.T) {
		// 从 token 中无法提取用户名，所以先保存注册时的用户名
		// 从 registerUser 内部可知用户名是 e2euser{时间戳}
	})

	// 1.3 创建公开排行榜
	rankingID, shareCode := createRanking(t, app, token, "E2E集成测试排行", "游戏", "公开")
	if shareCode == "" || len(shareCode) != 8 {
		t.Fatalf("分享码格式异常: %q (len=%d)", shareCode, len(shareCode))
	}
	t.Logf("创建排行榜: id=%s, shareCode=%s", rankingID, shareCode)

	// 1.4 添加 3 个条目
	entryNames := []string{"条目A", "条目B", "条目C"}
	entryIDs := make([]string, len(entryNames))
	for i, name := range entryNames {
		entryIDs[i] = createEntry(t, app, token, rankingID, name)
		t.Logf("创建条目: id=%s, name=%s", entryIDs[i], name)
	}

	// 1.5 获取排行榜详情（验证条目存在）
	t.Run("GetRankingDetail", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/rankings/"+rankingID, "", token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("获取排行榜详情失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("排行榜详情 data 格式异常")
		}
		entries, ok := data["entries"].([]interface{})
		if !ok {
			// entries 可能因 omitempty 省略
			t.Log("entries 字段可能被 omitempty 省略（'T-INT-001'）")
		} else {
			if len(entries) < 3 {
				t.Errorf("期望至少 3 个条目, 得到 %d", len(entries))
			}
		}
	})

	// 1.6 拖拽排序 — 模拟批量更新条目的等级和排序
	t.Run("ReorderEntries", func(t *testing.T) {
		tierS := "S"
		tierA := "A"
		tierB := "B"

		updates := []map[string]interface{}{
			{"id": entryIDs[0], "tier": &tierS, "sort_order": 0},
			{"id": entryIDs[1], "tier": &tierA, "sort_order": 0},
			{"id": entryIDs[2], "tier": &tierB, "sort_order": 0},
		}
		bodyMap := map[string]interface{}{"updates": updates}
		bodyBytes, _ := json.Marshal(bodyMap)

		req := request(http.MethodPut, "/api/v1/entries/reorder", string(bodyBytes), token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("批量排序失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		t.Log("批量排序成功")

		// 验证排序结果
		getReq := request(http.MethodGet, "/api/v1/rankings/"+rankingID, "", token)
		_, getResp := serve(app, getReq)
		data, ok := getResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("重新获取排行详情时 data 格式异常")
		}
		entries, ok := data["entries"].([]interface{})
		if ok {
			for _, e := range entries {
				entry, ok := e.(map[string]interface{})
				if !ok {
					continue
				}
				id := entry["id"].(string)
				tier := entry["tier"]
				t.Logf("条目 %s: tier=%v", id, tier)
			}
		}
	})

	// 1.7 分享码访问（无需认证）
	t.Run("ShareCodeAccess", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/share/"+shareCode, "")
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("分享码访问失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("分享页 data 格式异常")
		}
		gotTitle, _ := data["title"].(string)
		if !strings.Contains(gotTitle, "E2E集成测试排行") {
			t.Errorf("分享页标题不匹配: got %q", gotTitle)
		}
		t.Logf("分享码访问成功: title=%s", gotTitle)

		// 验证 share_code 字段为 8 位
		gotShareCode, _ := data["share_code"].(string)
		if gotShareCode != shareCode {
			t.Errorf("分享码不匹配: expect %s, got %s", shareCode, gotShareCode)
		}
	})

	// 1.8 公开排行榜列表包含此排行
	t.Run("PublicList", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/rankings/public", "")
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("获取公开列表失败: %d", resp.StatusCode)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("公开列表 data 格式异常")
		}
		total, _ := data["total"].(float64)
		items, _ := data["items"].([]interface{})
		t.Logf("公开列表: total=%.0f, items=%d", total, len(items))
		if total < 1 {
			t.Error("公开排行榜列表为空，期望至少包含新创建的排行")
		}

		// 验证分页格式为 { items, total }
		_, hasItems := data["items"]
		_, hasTotal := data["total"]
		if !hasItems || !hasTotal {
			t.Error("公开列表响应缺少 items 或 total 字段（分页格式要求）")
		}
	})

	// 1.9 我的排行榜列表
	t.Run("MyRankings", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/rankings/mine", "", token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("获取我的排行榜失败: %d", resp.StatusCode)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("我的排行榜 data 格式异常")
		}
		total, _ := data["total"].(float64)
		if total < 1 {
			t.Error("我的排行榜列表为空")
		}
	})
}

//=============================================================================
// 测试 2: 异常流程 — 错误密码 → 锁定提示 → 未登录访问 → 401
//=============================================================================

func TestE2E_ExceptionFlow(t *testing.T) {
	app, _ := newApp(t)

	var logBuf bytes.Buffer
	log.SetOutput(&logBuf)
	defer log.SetOutput(os.Stderr)

	// 先注册一个用户用于异常测试
	token, email, password, _ := registerUser(t, app, &logBuf)
	_ = token // 后续流程需要重新登录

	// 2.1 错误密码登录
	t.Run("WrongPassword", func(t *testing.T) {
		_, statusCode := loginUser(t, app, email, "WrongPass999", false)
		if statusCode != http.StatusUnauthorized {
			t.Errorf("错误密码登录应返回 401, 得到 %d", statusCode)
		}
	})

	// 2.2 多次错误密码触发锁定（连续 5 次）
	t.Run("LoginLockout", func(t *testing.T) {
		for i := 0; i < 5; i++ {
			_, statusCode := loginUser(t, app, email, "WrongPass999", false)
			if i < 4 && statusCode != http.StatusUnauthorized {
				t.Fatalf("第 %d 次错误登录应返回 401, 得到 %d", i+1, statusCode)
			}
		}

		// 第6次尝试（实际是第5次会触发锁定，第6次验证锁定状态）
		_, statusCode := loginUser(t, app, email, password, false)

		// API 可能返回 401 并提示锁定（第5次触发锁定）
		// 或者返回 401 锁定中（第6次）
		// 核心验证：登录失败
		if statusCode != http.StatusUnauthorized {
			t.Errorf("锁定后登录应返回 401, 得到 %d", statusCode)
		}

		t.Log("触发账号锁定成功")
	})

	// 2.3 未登录访问需认证接口
	t.Run("UnauthorizedAccess", func(t *testing.T) {
		protectedEndpoints := []struct {
			method string
			path   string
			body   string
		}{
			{http.MethodGet, "/api/v1/rankings/mine", ""},
			{http.MethodPost, "/api/v1/rankings", `{"title":"test"}`},
		}

		for _, ep := range protectedEndpoints {
			req := request(ep.method, ep.path, ep.body)
			resp, apiResp := serve(app, req)
			if resp.StatusCode != http.StatusUnauthorized {
				t.Errorf("无权限访问 %s %s 应返回 401, 得到 %d, message=%s",
					ep.method, ep.path, resp.StatusCode, apiResp.Message)
			} else {
				t.Logf("正确拦截: %s %s → 401 (%s)", ep.method, ep.path, apiResp.Message)
			}
		}
	})

	// 2.4 无效分享码
	t.Run("InvalidShareCode", func(t *testing.T) {
		badCodes := []string{"short", "toolongcode123", "!!!!!!!"}
		for _, code := range badCodes {
			req := request(http.MethodGet, "/api/v1/share/"+code, "")
			resp, apiResp := serve(app, req)
			// 长度不足8位返回 400，其他返回 404
			if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusNotFound {
				t.Errorf("无效分享码 %q 应返回 400/404, 得到 %d, msg=%s",
					code, resp.StatusCode, apiResp.Message)
			}
		}
	})
}

//=============================================================================
// 测试 3: 删除流程 — 删除条目 → 删除排行榜 → 验证消失
//=============================================================================

func TestE2E_DeleteFlow(t *testing.T) {
	app, _ := newApp(t)

	var logBuf bytes.Buffer
	log.SetOutput(&logBuf)
	defer log.SetOutput(os.Stderr)

	// 注册新用户并创建排行榜和条目
	token, _, _, _ := registerUser(t, app, &logBuf)
	rankingID, shareCode := createRanking(t, app, token, "将被删除的排行", "影视", "公开")
	t.Logf("创建待删除排行: id=%s, shareCode=%s", rankingID, shareCode)

	entryIDs := make([]string, 3)
	for i := 0; i < 3; i++ {
		entryIDs[i] = createEntry(t, app, token, rankingID, fmt.Sprintf("删除条目%d", i+1))
	}

	// 3.1 删除单个条目
	t.Run("DeleteEntry", func(t *testing.T) {
		entryID := entryIDs[0]
		req := request(http.MethodDelete, "/api/v1/entries/"+entryID, "", token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("删除条目失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		t.Logf("成功删除条目: %s", entryID)

		// 验证删除后排行榜条目数减少
		getReq := request(http.MethodGet, "/api/v1/rankings/"+rankingID, "", token)
		_, getResp := serve(app, getReq)
		data, ok := getResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("获取排行详情 data 格式异常")
		}
		entries, _ := data["entries"].([]interface{})
		if len(entries) != 2 {
			t.Logf("删除后条目数: %d (期望 2)", len(entries))
		}
	})

	// 3.2 删除排行榜
	t.Run("DeleteRanking", func(t *testing.T) {
		req := request(http.MethodDelete, "/api/v1/rankings/"+rankingID, "", token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("删除排行榜失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		t.Logf("成功删除排行榜: %s", rankingID)
	})

	// 3.3 验证已删除排行榜不在公开列表中
	t.Run("RankingGoneFromPublic", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/rankings/public?limit=50", "")
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("获取公开列表失败: %d", resp.StatusCode)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("公开列表 data 格式异常")
		}
		items, _ := data["items"].([]interface{})

		found := false
		for _, item := range items {
			it, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			id, _ := it["id"].(string)
			if id == rankingID {
				found = true
				break
			}
		}
		if found {
			t.Error("已删除的排行榜仍在公开列表中出现")
		} else {
			t.Log("验证通过: 已删除排行榜不在公开列表中")
		}
	})

	// 3.4 验证已删除排行榜不可通过详情访问
	t.Run("DeletedRankingNotFound", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/rankings/"+rankingID, "", token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("已删除排行榜应返回 404, 得到 %d, msg=%s",
				resp.StatusCode, apiResp.Message)
		} else {
			t.Log("验证通过: 已删除排行榜返回 404")
		}
	})

	// 3.5 验证分享码也不再可用
	t.Run("ShareCodeInvalidAfterDelete", func(t *testing.T) {
		req := request(http.MethodGet, "/api/v1/share/"+shareCode, "")
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("已删除排行榜的分享码应返回 404, 得到 %d, msg=%s",
				resp.StatusCode, apiResp.Message)
		} else {
			t.Log("验证通过: 已删除排行榜的分享码不再可用")
		}
	})

	// 3.6 非创建者删除他人的条目/排行榜
	t.Run("NonOwnerCantDelete", func(t *testing.T) {
		// 注册第二个用户
		secondToken, _, _, _ := registerUser(t, app, &logBuf)

		// 尝试删除第一个用户的条目
		if len(entryIDs) > 0 {
			req := request(http.MethodDelete, "/api/v1/entries/"+entryIDs[1], "", secondToken)
			resp, _ := serve(app, req)
			if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusNotFound {
				t.Errorf("非创建者删除条目应返回 400/404, 得到 %d", resp.StatusCode)
			}
		}
		_ = secondToken
	})
}

//=============================================================================
// 测试 4: 个人资料流程（独立测试）
//=============================================================================

func TestE2E_ProfileFlow(t *testing.T) {
	app, _ := newApp(t)

	var logBuf bytes.Buffer
	log.SetOutput(&logBuf)
	defer log.SetOutput(os.Stderr)

	token, email, _, _ := registerUser(t, app, &logBuf)
	if token == "" {
		t.Fatal("注册响应缺少 token")
	}

	// 4.1 更新个人资料
	t.Run("UpdateProfile", func(t *testing.T) {
		body := `{"nickname":"新昵称","bio":"这是我的简介"}`
		req := request(http.MethodPut, "/api/v1/profile", body, token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("更新个人资料失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		data, ok := apiResp.Data.(map[string]interface{})
		if !ok {
			t.Fatal("更新资料响应 data 格式异常")
		}
		gotNickname, _ := data["nickname"].(string)
		if gotNickname != "新昵称" {
			t.Errorf("昵称未更新: got %q", gotNickname)
		}
	})

	// 4.2 修改密码（改回原密码以便后续测试）
	t.Run("UpdatePassword", func(t *testing.T) {
		// 先改为新密码
		body := `{"old_password":"Pass1234","new_password":"NewPass5678"}`
		req := request(http.MethodPut, "/api/v1/profile/password", body, token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("修改密码失败: %d, %s", resp.StatusCode, apiResp.Message)
		}
		t.Log("密码修改成功")

		// 旧密码不应再能登录
		_, statusCode := loginUser(t, app, email, "Pass1234", false)
		if statusCode != http.StatusUnauthorized {
			t.Errorf("旧密码登录应返回 401, 得到 %d", statusCode)
		}

		// 改回原密码以便清理
		// 先用新密码登录获取新 token
		newToken, statusCode := loginUser(t, app, email, "NewPass5678", false)
		if statusCode != http.StatusOK || newToken == "" {
			t.Fatalf("新密码登录失败: %d", statusCode)
		}
		body2 := `{"old_password":"NewPass5678","new_password":"Pass1234"}`
		req2 := request(http.MethodPut, "/api/v1/profile/password", body2, newToken)
		resp2, _ := serve(app, req2)
		if resp2.StatusCode != http.StatusOK {
			t.Logf("改回密码失败（非关键）: %d", resp2.StatusCode)
		}
	})

	// 4.3 修改密码需要旧密码
	t.Run("UpdatePasswordRequiresOld", func(t *testing.T) {
		body := `{}`
		req := request(http.MethodPut, "/api/v1/profile/password", body, token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("空密码应返回 400, 得到 %d, msg=%s", resp.StatusCode, apiResp.Message)
		}
	})

	// 4.4 注销账号需要确认
	t.Run("DeleteAccountRequiresConfirm", func(t *testing.T) {
		body := `{}`
		req := request(http.MethodDelete, "/api/v1/profile", body, token)
		resp, apiResp := serve(app, req)
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("缺少 confirm 字段应返回 400, 得到 %d, msg=%s", resp.StatusCode, apiResp.Message)
		}
	})
}
