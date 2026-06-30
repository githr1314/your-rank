import http from './http'
import type {
  APIResponse,
  EntryCreateRequest,
  EntryResponse,
  ReorderRequest,
  SuccessMessage,
} from '@/types'

export async function create(data: EntryCreateRequest): Promise<APIResponse<EntryResponse>> {
  const res = await http.post<APIResponse<EntryResponse>>('/entries', data)
  return res.data
}

export async function update(
  id: string,
  data: EntryCreateRequest,
): Promise<APIResponse<EntryResponse>> {
  const res = await http.put<APIResponse<EntryResponse>>(`/entries/${id}`, data)
  return res.data
}

export async function remove(id: string): Promise<APIResponse<SuccessMessage>> {
  const res = await http.delete<APIResponse<SuccessMessage>>(`/entries/${id}`)
  return res.data
}

export async function reorder(data: ReorderRequest): Promise<APIResponse<SuccessMessage>> {
  const res = await http.put<APIResponse<SuccessMessage>>('/entries/reorder', data)
  return res.data
}
