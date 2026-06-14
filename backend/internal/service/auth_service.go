package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/model"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/pkg/validator"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepo
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepo, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, cfg: cfg}
}

// Register 用户注册，注册成功后直接返回 JWT token
func (s *AuthService) Register(username, email, password string) (string, *model.User, error) {
	// 校验输入
	username = validator.SanitizeString(username, 20)
	email = validator.SanitizeString(email, 255)

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

	// 生成 JWT token（默认 2 小时有效期）
	token, err := s.generateJWT(user.ID, 2*time.Hour)
	if err != nil {
		return "", nil, fmt.Errorf("生成凭证失败: %w", err)
	}

	return token, user, nil
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

func (s *AuthService) generateJWT(userID uuid.UUID, duration time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}
