package handler

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/yourrank/backend/internal/middleware"
	"github.com/yourrank/backend/internal/service"
	"github.com/yourrank/backend/pkg/response"
)

type UploadHandler struct {
	uploadService *service.UploadService
}

func NewUploadHandler(uploadService *service.UploadService) *UploadHandler {
	return &UploadHandler{uploadService: uploadService}
}

// UploadImage 上传单张图片（自动生成缩略图）
func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	// 限制请求体大小
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "文件大小不能超过10MB")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.BadRequest(w, "请选择要上传的图片")
		return
	}
	defer file.Close()

	result, err := h.uploadService.SaveWithThumbnails(userID, file, header)
	if err != nil {
		response.BadRequest(w, err.Error())
		return
	}

	response.Created(w, map[string]interface{}{
		"url":         result.URL,
		"thumb_s_url": result.ThumbSURL,
		"thumb_m_url": result.ThumbMURL,
		"file_name":   result.FileName,
		"file_size":   result.FileSize,
		"mime_type":   result.MimeType,
		"width":       result.Width,
		"height":      result.Height,
	})
}

// BatchUpload 批量上传图片（最多9张）
func (h *UploadHandler) BatchUpload(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.GetUserID(r)

	// 限制请求体大小（最大 10MB * 9）
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20*9)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		response.BadRequest(w, "文件大小超过限制")
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		response.BadRequest(w, "请选择要上传的图片")
		return
	}
	if len(files) > 9 {
		response.BadRequest(w, "批量上传最多9张图片")
		return
	}

	results := make([]map[string]interface{}, 0, len(files))
	for _, header := range files {
		file, err := header.Open()
		if err != nil {
			continue
		}

		result, err := h.uploadService.SaveWithThumbnails(userID, file, header)
		file.Close()
		if err != nil {
			continue
		}

		results = append(results, map[string]interface{}{
			"url":         result.URL,
			"thumb_s_url": result.ThumbSURL,
			"thumb_m_url": result.ThumbMURL,
			"file_name":   result.FileName,
			"file_size":   result.FileSize,
			"mime_type":   result.MimeType,
			"width":       result.Width,
			"height":      result.Height,
		})
	}

	if len(results) == 0 {
		response.BadRequest(w, "上传失败，请检查文件格式")
		return
	}

	response.Created(w, results)
}

// ServeUpload 静态文件服务
func (h *UploadHandler) ServeUpload(w http.ResponseWriter, r *http.Request) {
	// 安全校验：路径穿越防护
	requestPath := strings.TrimPrefix(r.URL.Path, "/uploads/")
	cleanPath := filepath.Clean(requestPath)
	if strings.Contains(cleanPath, "..") {
		response.Forbidden(w, "非法路径")
		return
	}

	filePath := filepath.Join(h.uploadService.GetUploadDir(), cleanPath)
	http.ServeFile(w, r, filePath)
}
