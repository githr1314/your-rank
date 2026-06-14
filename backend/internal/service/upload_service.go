package service

import (
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/disintegration/imaging"
	"github.com/google/uuid"
	"github.com/yourrank/backend/internal/config"
	"github.com/yourrank/backend/internal/model"
	"gorm.io/gorm"
)

var allowedMimeTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
	"image/webp": ".webp",
}

// UploadResult 上传结果
type UploadResult struct {
	URL       string `json:"url"`
	ThumbSURL string `json:"thumb_s_url"`
	ThumbMURL string `json:"thumb_m_url"`
	FileName  string `json:"file_name"`
	FileSize  int64  `json:"file_size"`
	MimeType  string `json:"mime_type"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
}

type UploadService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewUploadService(db *gorm.DB, cfg *config.Config) *UploadService {
	return &UploadService{db: db, cfg: cfg}
}

// GetUploadDir 返回上传目录路径
func (s *UploadService) GetUploadDir() string {
	return s.cfg.UploadDir
}

// SaveWithThumbnails 保存原图并生成缩略图，返回上传结果
func (s *UploadService) SaveWithThumbnails(userID uuid.UUID, file multipart.File, header *multipart.FileHeader) (*UploadResult, error) {
	// 检测真实 MIME 类型（读取前512字节）
	buffer := make([]byte, 512)
	if _, err := file.Read(buffer); err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	mimeType := http.DetectContentType(buffer)
	ext, ok := allowedMimeTypes[mimeType]
	if !ok {
		return nil, fmt.Errorf("仅支持 jpg/png/gif/webp 格式")
	}

	// 重置读取位置
	file.Seek(0, io.SeekStart)

	// 生成原始文件名并保存
	filename := fmt.Sprintf("%s_%s%s", userID.String()[:8], uuid.New().String()[:8], ext)
	userDir := filepath.Join(s.cfg.UploadDir, userID.String())
	if err := os.MkdirAll(userDir, 0755); err != nil {
		return nil, fmt.Errorf("创建上传目录失败: %w", err)
	}

	originPath := filepath.Join(userDir, filename)
	dst, err := os.Create(originPath)
	if err != nil {
		return nil, fmt.Errorf("创建文件失败: %w", err)
	}

	if _, err := io.Copy(dst, file); err != nil {
		dst.Close()
		return nil, fmt.Errorf("写入文件失败: %w", err)
	}
	dst.Close()

	// 读取原图获取尺寸并生成缩略图
	srcImg, err := imaging.Open(originPath)
	if err != nil {
		return nil, fmt.Errorf("读取图片失败: %w", err)
	}

	// 获取图片原始尺寸
	bounds := srcImg.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// 生成缩略图文件名
	thumbSFilename := fmt.Sprintf("%s_%s_200w%s", userID.String()[:8], uuid.New().String()[:8], ext)
	thumbMFilename := fmt.Sprintf("%s_%s_800w%s", userID.String()[:8], uuid.New().String()[:8], ext)

	// 生成 200px 缩略图（保持宽高比）
	thumbSURL := ""
	thumbSPath := filepath.Join(userDir, thumbSFilename)
	thumbSImg := imaging.Fit(srcImg, 200, 200, imaging.Lanczos)
	if err := imaging.Save(thumbSImg, thumbSPath); err != nil {
		log.Printf("[WARN] 生成200px缩略图失败: %v", err)
	} else {
		thumbSURL = fmt.Sprintf("/uploads/%s/%s", userID.String(), thumbSFilename)
	}

	// 生成 800px 缩略图（保持宽高比）
	thumbMURL := ""
	thumbMPath := filepath.Join(userDir, thumbMFilename)
	thumbMImg := imaging.Fit(srcImg, 800, 800, imaging.Lanczos)
	if err := imaging.Save(thumbMImg, thumbMPath); err != nil {
		log.Printf("[WARN] 生成800px缩略图失败: %v", err)
	} else {
		thumbMURL = fmt.Sprintf("/uploads/%s/%s", userID.String(), thumbMFilename)
	}

	// 构建原图 URL
	originURL := fmt.Sprintf("/uploads/%s/%s", userID.String(), filename)

	// 保存 Image 记录到数据库
	imageRecord := &model.Image{
		ID:        uuid.New(),
		UserID:    userID,
		OriginURL: originURL,
		ThumbSURL: thumbSURL,
		ThumbMURL: thumbMURL,
		FileSize:  int(header.Size),
		MimeType:  mimeType,
		Width:     width,
		Height:    height,
	}
	if err := s.db.Create(imageRecord).Error; err != nil {
		log.Printf("[WARN] 保存图片记录失败: %v", err)
	}

	return &UploadResult{
		URL:       originURL,
		ThumbSURL: thumbSURL,
		ThumbMURL: thumbMURL,
		FileName:  header.Filename,
		FileSize:  header.Size,
		MimeType:  mimeType,
		Width:     width,
		Height:    height,
	}, nil
}
