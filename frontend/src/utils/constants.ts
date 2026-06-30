/** API 基础路径 */
export const API_BASE_PATH = '/api/v1'

/** JWT token localStorage key */
export const TOKEN_KEY = 'your-rank-token'

/** 防抖保存延迟 (ms) */
export const DEBOUNCE_MS = 800

/** 分页默认值 */
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

/** 图片上传限制 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_BATCH_SIZE = 9
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const IMAGE_MAX_DIMENSION = 1920

/** Tier 等级 */
export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const

/** 可见范围 */
export const VISIBILITY_OPTIONS = ['公开', '私密', '仅链接'] as const

/** 分类标签 */
export const CATEGORIES = ['游戏', '影视', '音乐', '美食', '运动', '科技', '其他'] as const
