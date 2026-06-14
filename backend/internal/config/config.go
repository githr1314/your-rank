package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	UploadDir  string
}

func Load() *Config {
	_ = godotenv.Load() // 本地开发可选 .env

	return &Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "yourrank"),
		DBPassword: getEnv("DB_PASSWORD", "yourrank_secret"),
		DBName:     getEnv("DB_NAME", "yourrank"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-me"),
		UploadDir:  getEnv("UPLOAD_DIR", "./uploads"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
