import http from './http'
import type { APIResponse, RankingResponse } from '@/types'

export async function getByShareCode(code: string): Promise<APIResponse<RankingResponse>> {
  const res = await http.get<APIResponse<RankingResponse>>(`/share/${code}`)
  return res.data
}
