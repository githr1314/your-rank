import http from './http'
import type { APIResponse, UploadResponse } from '@/types'

export async function upload(file: File): Promise<APIResponse<UploadResponse>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await http.post<APIResponse<UploadResponse>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return res.data
}

export async function batchUpload(files: File[]): Promise<APIResponse<UploadResponse[]>> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const res = await http.post<APIResponse<UploadResponse[]>>('/upload/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
  return res.data
}
