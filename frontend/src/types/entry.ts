import type { TierEnum } from './common'

export interface EntryCreateRequest {
  ranking_id: string
  name: string
  description?: string
  image_url?: string
  link_url?: string
}

export interface EntryResponse {
  id: string
  ranking_id: string
  name: string
  description: string
  image_url: string
  link_url: string
  tier: TierEnum
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ReorderUpdate {
  id: string
  tier?: TierEnum
  sort_order: number
}

export interface ReorderRequest {
  updates: ReorderUpdate[]
}
