// ============ 用户 ============
export interface User {
  id: string
  username: string
  email: string
  nickname: string
  avatar_url: string
  bio: string
  last_login_at: string | null
}

export interface LoginRequest {
  account: string
  password: string
  remember_me: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ============ 排行榜 ============
export type Visibility = '公开' | '私密' | '仅链接'
export type Category = '游戏' | '影视' | '音乐' | '美食' | '运动' | '科技' | '其他'

export interface Ranking {
  id: string
  user_id: string
  title: string
  description: string
  cover_url: string
  category: Category
  visibility: Visibility
  share_code: string
  view_count: number
  entries?: Entry[]
  user?: User
  created_at: string
  updated_at: string
}

export interface CreateRankingRequest {
  title: string
  description: string
  cover_url?: string
  category: Category
  visibility: Visibility
}

// ============ 条目 ============
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D'

export const TIER_LABELS: Record<Tier, { name: string; emoji: string }> = {
  S: { name: '神中神', emoji: '👑' },
  A: { name: '杀疯了', emoji: '🔥' },
  B: { name: '有点料', emoji: '⚡' },
  C: { name: '还行吧', emoji: '✓' },
  D: { name: '凑个数', emoji: '🫧' },
}

export const TIER_ORDER: Tier[] = ['S', 'A', 'B', 'C', 'D']

export interface Entry {
  id: string
  ranking_id: string
  name: string
  description: string
  image_url: string
  link_url: string
  tier: Tier | null  // null = 待放置
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateEntryRequest {
  ranking_id: string
  name: string
  description: string
  image_url: string
  link_url: string
}

export interface ReorderRequest {
  updates: {
    id: string
    tier: Tier | null
    sort_order: number
  }[]
}

// ============ 通用 ============
export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export interface APIResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// ============ 上传 ============
export interface UploadResponse {
  url: string
  thumb_s_url: string
  thumb_m_url: string
  file_name: string
  file_size: number
  mime_type: string
  width: number
  height: number
}
