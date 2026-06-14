import axios, { AxiosError } from 'axios'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Ranking,
  CreateRankingRequest,
  Entry,
  CreateEntryRequest,
  ReorderRequest,
  PaginatedResponse,
  APIResponse,
  UploadResponse,
  User,
} from '@/types'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：注入 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<APIResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ============ Auth API ============
export const authAPI = {
  register: (data: RegisterRequest) =>
    api.post<APIResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<APIResponse<AuthResponse>>('/auth/login', data),
}

// ============ Profile API ============
export const profileAPI = {
  update: (data: { nickname?: string; bio?: string; avatar_url?: string }) =>
    api.put<APIResponse<User>>('/profile', data),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put<APIResponse<null>>('/profile/password', data),

  deleteAccount: () =>
    api.delete<APIResponse<null>>('/profile', { data: { confirm: true } }),
}

// ============ Ranking API ============
export const rankingAPI = {
  /** 创建排行榜 */
  create: (data: CreateRankingRequest) =>
    api.post<APIResponse<Ranking>>('/rankings', data),

  /** 获取详情 */
  get: (id: string) =>
    api.get<APIResponse<Ranking>>(`/rankings/${id}`),

  /** 更新排行榜 */
  update: (id: string, data: Partial<CreateRankingRequest>) =>
    api.put<APIResponse<Ranking>>(`/rankings/${id}`, data),

  /** 删除排行榜 */
  delete: (id: string) =>
    api.delete<APIResponse<{ message: string }>>(`/rankings/${id}`),

  /** 我的排行榜 */
  listMine: (offset = 0, limit = 20) =>
    api.get<APIResponse<PaginatedResponse<Ranking>>>('/rankings/mine', {
      params: { offset, limit },
    }),

  /** 公开排行榜（发现页） */
  listPublic: (params: { offset?: number; limit?: number; category?: string; keyword?: string }) =>
    api.get<APIResponse<PaginatedResponse<Ranking>>>('/rankings/public', { params }),

  /** 通过分享码获取 */
  getByShareCode: (code: string) =>
    api.get<APIResponse<Ranking>>(`/share/${code}`),
}

// ============ Entry API ============
export const entryAPI = {
  /** 创建条目 */
  create: (data: CreateEntryRequest) =>
    api.post<APIResponse<Entry>>('/entries', data),

  /** 更新条目 */
  update: (id: string, data: Partial<CreateEntryRequest>) =>
    api.put<APIResponse<Entry>>(`/entries/${id}`, data),

  /** 删除条目 */
  delete: (id: string) =>
    api.delete<APIResponse<{ message: string }>>(`/entries/${id}`),

  /** 批量重新排序 */
  reorder: (data: ReorderRequest) =>
    api.put<APIResponse<{ message: string }>>('/entries/reorder', data),
}

// ============ Upload API ============
export const uploadAPI = {
  /** 上传图片 */
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<APIResponse<UploadResponse>>(
      '/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  /** 批量上传图片（最多 9 张） */
  batch: (files: File[]) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('files', f))
    return api.post<APIResponse<UploadResponse[]>>(
      '/upload/batch',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
}

export default api
