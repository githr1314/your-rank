package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/pkg/response"
)

type contextKey string

const UserIDKey contextKey = "userID"

func AuthRequired(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extractToken(r)
			if token == "" {
				response.Unauthorized(w, "请先登录")
				return
			}

			claims, err := parseJWT(token, cfg.JWTSecret)
			if err != nil {
				response.Unauthorized(w, "登录已过期，请重新登录")
				return
			}

			userID, err := uuid.Parse(claims.Subject)
			if err != nil {
				response.Unauthorized(w, "无效的登录凭证")
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID 从 context 获取当前登录用户 ID
func GetUserID(r *http.Request) (uuid.UUID, bool) {
	id, ok := r.Context().Value(UserIDKey).(uuid.UUID)
	return id, ok
}

func extractToken(r *http.Request) string {
	bearer := r.Header.Get("Authorization")
	if strings.HasPrefix(bearer, "Bearer ") {
		return strings.TrimPrefix(bearer, "Bearer ")
	}
	return ""
}

func parseJWT(tokenStr, secret string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	return token.Claims.(*jwt.RegisteredClaims), nil
}
