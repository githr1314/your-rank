package validator

import (
	"regexp"
	"strings"

	goValidator "github.com/go-playground/validator/v10"
)

var Validate *goValidator.Validate

func init() {
	Validate = goValidator.New()
	_ = Validate.RegisterValidation("username", validateUsername)
	_ = Validate.RegisterValidation("safehtml", validateSafeHTML)
}

// validateUsername 校验用户名：2-20字符，仅中英文、数字、下划线
func validateUsername(fl goValidator.FieldLevel) bool {
	re := regexp.MustCompile(`^[\p{Han}a-zA-Z0-9_]{2,20}$`)
	return re.MatchString(fl.Field().String())
}

// validateSafeHTML 基础 XSS 防护：拒绝含 script/iframe 标签的内容
func validateSafeHTML(fl goValidator.FieldLevel) bool {
	lower := strings.ToLower(fl.Field().String())
	return !strings.Contains(lower, "<script") &&
		!strings.Contains(lower, "<iframe") &&
		!strings.Contains(lower, "javascript:")
}

// SanitizeString 去除首尾空格，截断超长字符串
func SanitizeString(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	if len(s) > maxLen {
		s = s[:maxLen]
	}
	return s
}
