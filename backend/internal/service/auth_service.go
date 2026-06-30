package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/smtp"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/model"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/pkg/validator"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type verifyCodeInfo struct {
	Code        string
	ExpireAt    time.Time
	SendCount   int
	FirstSentAt time.Time
	Attempts    int
}

type AuthService struct {
	userRepo        *repository.UserRepo
	cfg             *config.Config
	db              *gorm.DB
	verifyCodeMu    sync.Mutex
	verifyCodeStore map[string]*verifyCodeInfo
}

func NewAuthService(userRepo *repository.UserRepo, cfg *config.Config, db *gorm.DB) *AuthService {
	return &AuthService{
		userRepo:        userRepo,
		cfg:             cfg,
		db:              db,
		verifyCodeStore: make(map[string]*verifyCodeInfo),
	}
}

const (
	verifyCodeMaxPerHour     = 3
	verifyCodeMaxAttempts    = 5
	verifyCodeExpireDuration = 10 * time.Minute
)

// Register 用户注册，注册成功后直接返回 JWT token
func (s *AuthService) Register(username, email, password, verifyCode string) (string, *model.User, error) {
	// 校验输入
	username = validator.SanitizeString(username, 20)
	email = validator.SanitizeString(email, 255)

	// 校验验证码
	if verifyCode == "" {
		return "", nil, errors.New("请输入验证码")
	}
	if len(verifyCode) != 6 {
		return "", nil, errors.New("验证码格式错误")
	}
	if err := s.checkVerifyCode(email, verifyCode); err != nil {
		return "", nil, err
	}

	// 查重
	if _, err := s.userRepo.FindByEmail(email); err == nil {
		return "", nil, errors.New("该邮箱已被注册")
	}
	if _, err := s.userRepo.FindByUsername(username); err == nil {
		return "", nil, errors.New("该用户名已被使用")
	}

	// 密码加密
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", nil, fmt.Errorf("密码加密失败: %w", err)
	}

	user := &model.User{
		ID:       uuid.New(),
		Username: username,
		Email:    email,
		Password: string(hashed),
		Nickname: username,
	}

	if err := s.userRepo.Create(user); err != nil {
		return "", nil, fmt.Errorf("注册失败: %w", err)
	}

	// 注册成功后清除验证码
	s.verifyCodeMu.Lock()
	delete(s.verifyCodeStore, email)
	s.verifyCodeMu.Unlock()

	// 生成 JWT token（默认 2 小时有效期）
	token, err := s.generateJWT(user.ID, 2*time.Hour)
	if err != nil {
		return "", nil, fmt.Errorf("生成凭证失败: %w", err)
	}

	return token, user, nil
}

// checkVerifyCode 校验验证码
func (s *AuthService) checkVerifyCode(email, code string) error {
	s.verifyCodeMu.Lock()
	defer s.verifyCodeMu.Unlock()

	info, exists := s.verifyCodeStore[email]
	if !exists {
		return errors.New("验证码不存在或已过期，请重新获取")
	}

	if time.Now().After(info.ExpireAt) {
		delete(s.verifyCodeStore, email)
		return errors.New("验证码已过期，请重新获取")
	}

	if info.Code != code {
		info.Attempts++
		if info.Attempts >= verifyCodeMaxAttempts {
			delete(s.verifyCodeStore, email)
			return errors.New("验证码错误次数过多，请重新获取")
		}
		return errors.New("验证码错误")
	}

	return nil
}

// Login 用户登录，返回 JWT token
func (s *AuthService) Login(account, password string, rememberMe bool) (string, *model.User, error) {
	account = validator.SanitizeString(account, 255)

	// 尝试邮箱或用户名查找
	user, err := s.userRepo.FindByEmail(account)
	if err != nil {
		user, err = s.userRepo.FindByUsername(account)
		if err != nil {
			return "", nil, errors.New("账号不存在")
		}
	}

	// 检查锁定
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return "", nil, fmt.Errorf("账号已锁定，请 %s 后再试",
			time.Until(*user.LockedUntil).Truncate(time.Minute).String())
	}

	// 校验密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		user.LoginFailCount++
		if user.LoginFailCount >= 5 {
			lockUntil := time.Now().Add(15 * time.Minute)
			user.LockedUntil = &lockUntil
			user.LoginFailCount = 0
		}
		_ = s.userRepo.Update(user)
		return "", nil, errors.New("密码错误")
	}

	// 登录成功，重置计数
	user.LoginFailCount = 0
	user.LockedUntil = nil
	now := time.Now()
	user.LastLoginAt = &now
	_ = s.userRepo.Update(user)

	// 生成 JWT
	duration := 2 * time.Hour
	if rememberMe {
		duration = 7 * 24 * time.Hour
	}

	token, err := s.generateJWT(user.ID, duration)
	if err != nil {
		return "", nil, fmt.Errorf("生成凭证失败: %w", err)
	}

	return token, user, nil
}

// SendVerifyCode 发送邮箱验证码
func (s *AuthService) SendVerifyCode(email string) (map[string]interface{}, error) {
	email = validator.SanitizeString(email, 255)

	// 基础邮箱格式校验
	if len(email) < 5 || !strings.Contains(email, "@") {
		return nil, errors.New("邮箱格式不正确")
	}

	// 频率限制检查（相同邮箱1小时内最多3次）
	s.verifyCodeMu.Lock()
	info, exists := s.verifyCodeStore[email]
	if exists {
		// 重置计数器：距离首次发送超过1小时
		if time.Since(info.FirstSentAt) > time.Hour {
			info.SendCount = 0
			info.FirstSentAt = time.Now()
		}
		if info.SendCount >= verifyCodeMaxPerHour {
			s.verifyCodeMu.Unlock()
			return nil, errors.New("发送过于频繁，请1小时后再试")
		}
	}
	s.verifyCodeMu.Unlock()

	// 生成6位验证码
	code, err := generateVerifyCode()
	if err != nil {
		return nil, fmt.Errorf("生成验证码失败: %w", err)
	}

	now := time.Now()
	expireAt := now.Add(verifyCodeExpireDuration)

	// 更新存储记录
	s.verifyCodeMu.Lock()
	info, exists = s.verifyCodeStore[email]
	if exists {
		info.Code = code
		info.ExpireAt = expireAt
		info.SendCount++
		info.Attempts = 0
		// 重置计数器：距离首次发送超过1小时
		if time.Since(info.FirstSentAt) > time.Hour {
			info.SendCount = 1
			info.FirstSentAt = now
		}
	} else {
		s.verifyCodeStore[email] = &verifyCodeInfo{
			Code:        code,
			ExpireAt:    expireAt,
			SendCount:   1,
			FirstSentAt: now,
			Attempts:    0,
		}
	}
	s.verifyCodeMu.Unlock()

	// 如果用户已存在，同时持久化验证码到数据库
	user, err := s.userRepo.FindByEmail(email)
	if err == nil {
		user.VerifyCode = &code
		user.VerifyCodeExpire = &expireAt
		user.VerifyCodeAttempts = 0
		_ = s.userRepo.Update(user)
	}

	// 发送邮件（SMTP不可用则输出到控制台）
	if err := s.sendSMTPEmail(email, code); err != nil {
		log.Printf("发送验证码邮件失败 (email=%s): %v", email, err)
	}

	return map[string]interface{}{
		"message":    "验证码已发送",
		"expires_in": int(verifyCodeExpireDuration.Seconds()),
	}, nil
}

// generateVerifyCode 生成6位随机数字验证码
func generateVerifyCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// sendSMTPEmail 通过 SMTP 发送验证码邮件
func (s *AuthService) sendSMTPEmail(to, code string) error {
	if s.cfg.SMTPHost == "" {
		// 开发模式：输出到控制台
		log.Printf("[DEV] 验证码邮件: 发送至 %s, 验证码: %s", to, code)
		return nil
	}

	auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPassword, s.cfg.SMTPHost)
	subject := "Your Rank 邮箱验证码"
	body := fmt.Sprintf(`<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
<h2>Your Rank 验证码</h2>
<p>您正在注册 Your Rank 账号，验证码为：</p>
<div style="font-size:32px;font-weight:bold;text-align:center;padding:16px;background:#f5f5f7;border-radius:12px;letter-spacing:8px;margin:16px 0">%s</div>
<p>验证码有效期为 10 分钟。如非本人操作，请忽略此邮件。</p>
</div>`, code)

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		s.cfg.SMTPFrom, to, subject, body)

	addr := s.cfg.SMTPHost + ":" + s.cfg.SMTPPort
	return smtp.SendMail(addr, auth, s.cfg.SMTPFrom, []string{to}, []byte(msg))
}

func (s *AuthService) generateJWT(userID uuid.UUID, duration time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}
