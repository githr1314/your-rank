import http from './http'
import type {
  APIResponse,
  PaginatedResponse,
  RankingCardResponse,
  RankingCreateRequest,
  RankingListParams,
  MyRankingListParams,
  RankingResponse,
  SuccessMessage,
} from '@/types'

export async function listPublic(
  params: RankingListParams,
): Promise<APIResponse<PaginatedResponse<RankingCardResponse>>> {
  const res = await http.get<APIResponse<PaginatedResponse<RankingCardResponse>>>(
    '/rankings/public',
    { params },
  )
  return res.data
}

export async function listMy(
  params: MyRankingListParams,
): Promise<APIResponse<PaginatedResponse<RankingCardResponse>>> {
  const res = await http.get<APIResponse<PaginatedResponse<RankingCardResponse>>>(
    '/rankings/mine',
    { params },
  )
  return res.data
}

export async function getById(id: string): Promise<APIResponse<RankingResponse>> {
  const res = await http.get<APIResponse<RankingResponse>>(`/rankings/${id}`)
  return res.data
}

export async function create(
  data: RankingCreateRequest,
): Promise<APIResponse<RankingResponse>> {
  const res = await http.post<APIResponse<RankingResponse>>('/rankings', data)
  return res.data
}

export async function update(
  id: string,
  data: RankingCreateRequest,
): Promise<APIResponse<RankingResponse>> {
  const res = await http.put<APIResponse<RankingResponse>>(`/rankings/${id}`, data)
  return res.data
}

export async function remove(id: string): Promise<APIResponse<SuccessMessage>> {
  const res = await http.delete<APIResponse<SuccessMessage>>(`/rankings/${id}`)
  return res.data
}
