package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/handler"
	"github.com/yourrank/backend/internal/middleware"
	"github.com/yourrank/backend/internal/repository"
	"github.com/yourrank/backend/internal/service"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	// --- 全局中间件 ---
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)
	r.Use(cors.Handler(middleware.CORS()))

	// 通用频率限制：100 req/s
	globalLimiter := middleware.NewRateLimiter(rate.Limit(100), 200)
	r.Use(globalLimiter.Limit)

	// --- 依赖注入 ---
	userRepo := repository.NewUserRepo(db)
	rankingRepo := repository.NewRankingRepo(db)
	entryRepo := repository.NewEntryRepo(db)

	authService := service.NewAuthService(userRepo, cfg, db)
	rankingService := service.NewRankingService(rankingRepo, entryRepo)
	entryService := service.NewEntryService(entryRepo, rankingRepo)
	uploadService := service.NewUploadService(db, cfg)
	profileService := service.NewProfileService(userRepo, db)

	authHandler := handler.NewAuthHandler(authService)
	rankingHandler := handler.NewRankingHandler(rankingService, rankingRepo)
	entryHandler := handler.NewEntryHandler(entryService)
	uploadHandler := handler.NewUploadHandler(uploadService)
	profileHandler := handler.NewProfileHandler(profileService)

	// 严格频率限制：注册 3 req/min，上传/批量 20 req/min
	strictLimiter := middleware.NewRateLimiter(rate.Limit(0.05), 3)  // ~3/min
	uploadLimiter := middleware.NewRateLimiter(rate.Limit(0.33), 10) // ~20/min

	// --- 路由 ---
	r.Route("/api/v1", func(r chi.Router) {

		// 公开路由
		r.Group(func(r chi.Router) {
			r.With(strictLimiter.Limit).Post("/auth/register", authHandler.Register)
			r.Post("/auth/login", authHandler.Login)
			r.Post("/auth/send-verify-code", authHandler.SendVerifyCode)
			r.Get("/rankings/public", rankingHandler.ListPublic)
			r.Get("/share/{code}", rankingHandler.GetByShareCode)
		})

		// 需要登录的路由
		r.Group(func(r chi.Router) {
			r.Use(middleware.AuthRequired(cfg))

			// 排行榜
			r.Post("/rankings", rankingHandler.Create)
			r.Get("/rankings/mine", rankingHandler.ListMy)
			r.Get("/rankings/{id}", rankingHandler.Get)
			r.Put("/rankings/{id}", rankingHandler.Update)
			r.Delete("/rankings/{id}", rankingHandler.Delete)

			// 条目
			r.Post("/entries", entryHandler.Create)
			r.Put("/entries/{id}", entryHandler.Update)
			r.Delete("/entries/{id}", entryHandler.Delete)
			r.Put("/entries/reorder", entryHandler.Reorder)

			// 上传
			r.With(uploadLimiter.Limit).Post("/upload", uploadHandler.UploadImage)
			r.With(uploadLimiter.Limit).Post("/upload/batch", uploadHandler.BatchUpload)

			// 个人资料
			r.Put("/profile", profileHandler.UpdateProfile)
			r.Put("/profile/password", profileHandler.UpdatePassword)
			r.Delete("/profile", profileHandler.DeleteAccount)
		})
	})

	// 静态文件服务（上传的图片）
	r.Get("/uploads/*", uploadHandler.ServeUpload)

	// 健康检查
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	return r
}
