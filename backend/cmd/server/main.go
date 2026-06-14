package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/database"
	"github.com/yourrank/backend/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	r := router.Setup(db, cfg)

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("🚀 Your Rank API 启动于 http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
