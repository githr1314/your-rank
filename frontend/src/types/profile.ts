export interface ProfileUpdateRequest {
  nickname?: string
  bio?: string
  avatar_url?: string
}

export interface PasswordUpdateRequest {
  old_password: string
  new_password: string
}

export interface DeleteAccountRequest {
  confirm: boolean
}
