import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Separator from '@radix-ui/react-separator'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { cn } from '@/utils/cn'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  IMAGE_MAX_DIMENSION,
} from '@/utils/constants'
import * as profileAPI from '@/services/profileAPI'
import * as uploadAPI from '@/services/uploadAPI'
import type { ProfileUpdateRequest } from '@/types'

/* ── Shared style classes ── */

const inputBase =
  'w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-low text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20'

const btnPrimary =
  'px-5 py-2 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const btnDanger =
  'px-5 py-2 rounded-lg bg-error text-on-error text-label-sm font-label-sm hover:bg-error-container hover:text-on-error-container transition-colors'

/**
 * T-FE-009 个人中心页
 *
 * 包含: 头像编辑 / 昵称编辑 / 简介编辑 / 修改密码 / 注销账号(二次确认)。
 */
export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  // ── Profile form state ──
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // ── Password form state ──
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // ── Delete account state ──
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Avatar upload state ──
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Initialise form fields from the current user data */
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatar_url || '')
      setAvatarPreview(user.avatar_url || null)
    }
  }, [user])

  // ── Avatar: compress image via canvas ──
  const compressImage = useCallback(
    (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          if (
            width > IMAGE_MAX_DIMENSION ||
            height > IMAGE_MAX_DIMENSION
          ) {
            const ratio = Math.min(
              IMAGE_MAX_DIMENSION / width,
              IMAGE_MAX_DIMENSION / height,
            )
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建 canvas 上下文'))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('图片压缩失败'))
            },
            file.type,
            0.8,
          )
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = URL.createObjectURL(file)
      })
    },
    [],
  )

  // ── Avatar: handle file selection → compress → upload → auto-save ──
  const handleAvatarFile = useCallback(
    async (file: File) => {
      // Validate
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('不支持的文件格式，仅支持 JPG/PNG/GIF/WebP')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('文件超过 10MB 限制')
        return
      }

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file)
      setAvatarPreview(localUrl)
      setIsUploadingAvatar(true)

      try {
        // Compress
        const compressedBlob = await compressImage(file)
        const compressedFile = new File(
          [compressedBlob],
          file.name,
          { type: file.type },
        )

        // Upload
        const res = await uploadAPI.upload(compressedFile)
        const serverUrl = res.data.url
        URL.revokeObjectURL(localUrl)

        setAvatarPreview(serverUrl)
        setAvatarUrl(serverUrl)

        // Auto-save the new avatar to profile
        try {
          await profileAPI.updateProfile({ avatar_url: serverUrl })
          if (user) {
            updateUser({ ...user, avatar_url: serverUrl })
          }
          toast.success('头像已更新')
        } catch {
          toast.error('头像更新失败，请稍后重试')
        }
      } catch {
        toast.error('头像上传失败')
        setAvatarPreview(avatarUrl || null)
      } finally {
        setIsUploadingAvatar(false)
      }
    },
    [avatarUrl, compressImage, user, updateUser],
  )

  const handleAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarFile(file)
    }
    // Allow re-selecting the same file
    e.target.value = ''
  }

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  // ── Profile: save nickname / bio ──
  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const payload: ProfileUpdateRequest = {}
      const trimmedNickname = nickname.trim()
      const trimmedBio = bio.trim()
      if (trimmedNickname !== (user?.nickname || '')) {
        payload.nickname = trimmedNickname
      }
      if (trimmedBio !== (user?.bio || '')) {
        payload.bio = trimmedBio
      }
      if (avatarUrl !== (user?.avatar_url || '')) {
        payload.avatar_url = avatarUrl
      }

      if (Object.keys(payload).length === 0) {
        toast('没有需要保存的变更')
        return
      }

      const res = await profileAPI.updateProfile(payload)
      // res.data is the updated UserProfile (from APIResponse wrapper)
      const updatedProfile = res.data
      updateUser(updatedProfile)
      toast.success('个人资料已更新')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr?.response?.data?.message || '保存失败，请重试')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // ── Password: validate and save ──
  const handleSavePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入当前密码')
      return
    }
    if (newPassword.length < 8) {
      toast.error('新密码至少 8 个字符')
      return
    }
    if (newPassword.length > 32) {
      toast.error('新密码不能超过 32 个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setIsSavingPassword(true)
    try {
      await profileAPI.updatePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success('密码已修改')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr?.response?.data?.message || '密码修改失败')
    } finally {
      setIsSavingPassword(false)
    }
  }

  // ── Account: delete ──
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await profileAPI.deleteAccount({ confirm: true })
      toast.success('账号已注销')
      logout()
      navigate('/home')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr?.response?.data?.message || '注销失败')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // ── Render ──

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-body-md text-on-surface-variant">
            加载中...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-margin-edge py-8 space-y-8 pb-16">
      {/* ── Page Title ── */}
      <h1 className="text-headline-md text-on-surface">个人中心</h1>

      {/* ── Avatar Section ── */}
      <section className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploadingAvatar}
          className={cn(
            'relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0',
            'bg-surface-container-high border-2 border-border-light',
            'hover:border-primary hover:ring-2 hover:ring-primary/30',
            'transition-all outline-none',
            isUploadingAvatar && 'pointer-events-none',
          )}
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="头像"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-headline-md text-on-surface-variant select-none">
              {(user.nickname || user.username)?.[0]?.toUpperCase() || '?'}
            </span>
          )}

          {/* Upload overlay */}
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}
        </button>

        <div className="min-w-0">
          <h2 className="text-headline-sm text-on-surface truncate">
            {user.nickname || user.username}
          </h2>
          <p className="text-body-md text-on-surface-variant truncate">
            {user.email}
          </p>
          <button
            type="button"
            onClick={handleAvatarClick}
            className={cn(
              'mt-1 text-body-md transition-colors',
              isUploadingAvatar
                ? 'text-on-surface-variant/50 cursor-not-allowed'
                : 'text-primary hover:text-primary-container',
            )}
          >
            {isUploadingAvatar ? '上传中...' : '更换头像'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </section>

      {/* ─────────────────────────────────────── */}
      <Separator.Root className="h-px bg-border-light w-full" />

      {/* ── Profile Form ── */}
      <section>
        <h2 className="text-headline-sm text-on-surface mb-4">个人资料</h2>
        <div className="space-y-4">
          {/* Nickname */}
          <div>
            <label
              htmlFor="profile-nickname"
              className="text-label-sm text-on-surface-variant mb-1 block"
            >
              昵称
            </label>
            <input
              id="profile-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              placeholder="设置你的昵称"
              className={inputBase}
            />
            <p className="text-label-sm text-on-surface-variant/60 mt-1 text-right">
              {nickname.length}/50
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="profile-bio"
              className="text-label-sm text-on-surface-variant mb-1 block"
            >
              简介
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="介绍一下自己..."
              rows={4}
              className={cn(inputBase, 'resize-none')}
            />
            <p className="text-label-sm text-on-surface-variant/60 mt-1 text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className={btnPrimary}
            >
              {isSavingProfile ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────── */}
      <Separator.Root className="h-px bg-border-light w-full" />

      {/* ── Password Form ── */}
      <section>
        <h2 className="text-headline-sm text-on-surface mb-4">修改密码</h2>
        <div className="space-y-4">
          {/* Old password */}
          <div>
            <label
              htmlFor="pwd-old"
              className="text-label-sm text-on-surface-variant mb-1 block"
            >
              当前密码
            </label>
            <input
              id="pwd-old"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="输入当前密码"
              className={inputBase}
              autoComplete="current-password"
            />
          </div>

          {/* New password */}
          <div>
            <label
              htmlFor="pwd-new"
              className="text-label-sm text-on-surface-variant mb-1 block"
            >
              新密码
            </label>
            <input
              id="pwd-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8-32 位，包含字母和数字"
              maxLength={32}
              className={inputBase}
              autoComplete="new-password"
            />
          </div>

          {/* Confirm new password */}
          <div>
            <label
              htmlFor="pwd-confirm"
              className="text-label-sm text-on-surface-variant mb-1 block"
            >
              确认新密码
            </label>
            <input
              id="pwd-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              maxLength={32}
              className={inputBase}
              autoComplete="new-password"
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSavePassword}
              disabled={isSavingPassword}
              className={btnPrimary}
            >
              {isSavingPassword ? '修改中...' : '修改密码'}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────── */}
      <Separator.Root className="h-px bg-border-light w-full" />

      {/* ── Danger Zone: Delete Account ── */}
      <section>
        <h2 className="text-headline-sm text-on-surface mb-2">危险区域</h2>
        <p className="text-body-md text-on-surface-variant mb-4 leading-relaxed">
          注销账号将永久删除您的所有数据，包括排行榜、条目和图片。
          <br />
          此操作不可恢复，请谨慎操作。
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          className={btnDanger}
        >
          注销账号
        </button>
      </section>

      {/* ── Delete Account Confirm Dialog ── */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="注销账号"
        description={
          <span>
            此操作将永久删除你的账号及所有关联数据，不可恢复。
            <br />
            请输入 <strong>{user.username}</strong> 以确认注销。
          </span>
        }
        confirmText="确认注销"
        onConfirm={handleDeleteAccount}
        variant="danger"
        requireInput={user.username}
        isLoading={isDeleting}
      />
    </div>
  )
}
