import type { CategoryEnum, VisibilityEnum } from './common'
import type { UserProfile } from './auth'
import type { EntryResponse } from './entry'

export interface RankingCreateRequest {
  title: string
  description?: string
  cover_url?: string
  category?: CategoryEnum
  visibility?: VisibilityEnum
}

export interface RankingResponse {
  id: string
  user_id: string
  title: string
  description: string
  cover_url: string
  category: string
  visibility: string
  share_code: string
  view_count: number
  created_at: string
  updated_at: string
  entries: EntryResponse[]
  user: UserProfile
}

export interface TierSummary {
  [key: string]: number
}

export interface RankingCardResponse {
  id: string
  user_id: string
  title: string
  cover_url: string
  category: string
  visibility: string
  share_code: string
  view_count: number
  entry_count: number
  tier_summary: TierSummary
  created_at: string
  updated_at: string
  user: UserProfile
}

export interface RankingListParams {
  offset?: number
  limit?: number
  category?: string
  keyword?: string
}

export interface MyRankingListParams {
  offset?: number
  limit?: number
  category?: string
  sort_by?: 'created_at' | 'updated_at'
}
