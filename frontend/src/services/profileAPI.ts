import http from './http'
import type {
  APIResponse,
  DeleteAccountRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  SuccessMessage,
  UserProfile,
} from '@/types'

export type { DeleteAccountRequest, PasswordUpdateRequest, ProfileUpdateRequest }

export async function updateProfile(
  data: ProfileUpdateRequest,
): Promise<APIResponse<UserProfile>> {
  const res = await http.put<APIResponse<UserProfile>>('/profile', data)
  return res.data
}

export async function updatePassword(
  data: PasswordUpdateRequest,
): Promise<APIResponse<SuccessMessage>> {
  const res = await http.put<APIResponse<SuccessMessage>>('/profile/password', data)
  return res.data
}

export async function deleteAccount(
  data: DeleteAccountRequest,
): Promise<APIResponse<SuccessMessage>> {
  const res = await http.delete<APIResponse<SuccessMessage>>('/profile', { data })
  return res.data
}
