export interface ErrorResponse {
  error: string
  code: number
}

export interface SuccessMessage {
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

export type TierEnum = 'S' | 'A' | 'B' | 'C' | 'D' | null

export type VisibilityEnum = '公开' | '私密' | '仅链接'

export type CategoryEnum = '游戏' | '影视' | '音乐' | '美食' | '运动' | '科技' | '其他'

export interface APIResponse<T> {
  code: number
  message: string
  data: T
}
