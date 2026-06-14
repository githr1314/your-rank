import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getUser, logout } from '@/hooks/useAuth'
import { profileAPI, uploadAPI } from '@/services/api'
import ImageUploader from '@/components/common/ImageUploader'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = getUser()

  // 资料编辑
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // 密码修改
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // 删除账号
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInputValue, setDeleteInputValue] = useState('')

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-gray-400 text-lg mb-4">请先登录</p>
          <Link to="/login">
            <Button>去登录</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 头像上传
  const handleAvatarUpload = async (file: File): Promise<string> => {
    const res = await uploadAPI.uploadImage(file)
    return res.data.data.url
  }

  // 保存资料
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await profileAPI.update({ nickname, bio, avatar_url: avatarUrl || undefined })
      // 更新本地 user
      const updatedUser = { ...user, nickname, bio, avatar_url: avatarUrl }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      window.dispatchEvent(new Event('auth-change'))
      toast.success('资料已更新')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '保存失败')
    } finally {
      setSavingProfile(false)
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入旧密码')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('新密码至少 8 个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }
    setChangingPassword(true)
    try {
      await profileAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })
      toast.success('密码已修改，请重新登录')
      logout()
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '修改密码失败')
    } finally {
      setChangingPassword(false)
    }
  }

  // 注销账号
  const handleDeleteAccount = async () => {
    try {
      await profileAPI.deleteAccount()
      toast.success('账号已注销')
      logout()
      navigate('/home')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '注销失败')
    } finally {
      setShowDeleteConfirm(false)
      setDeleteInputValue('')
    }
  }

  const hasProfileChanges =
    nickname !== (user.nickname || '') ||
    bio !== (user.bio || '') ||
    avatarUrl !== (user.avatar_url || '')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">个人中心</h1>

      {/* 个人信息卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        {/* 头像 + 基本资料 */}
        <div className="flex items-center gap-6">
          <ImageUploader
            onUploaded={setAvatarUrl}
            uploadFn={handleAvatarUpload}
            currentUrl={avatarUrl}
            shape="circle"
            placeholder="更换"
            sizeHint="点击更换头像"
          />
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user.username}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-300 mt-1">
              ID: {user.id}
            </p>
          </div>
        </div>

        {/* 昵称 */}
        <div className="space-y-2">
          <Label htmlFor="nickname">昵称</Label>
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            placeholder="设置昵称（选填）"
          />
        </div>

        {/* 简介 */}
        <div className="space-y-2">
          <Label htmlFor="bio">个人简介</Label>
          <Textarea
            id="bio"
            className="min-h-[80px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="介绍一下自己吧（选填）"
          />
          <p className="text-xs text-gray-400">{bio.length}/500</p>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={savingProfile || !hasProfileChanges}
        >
          {savingProfile ? '保存中...' : '保存修改'}
        </Button>
      </div>

      {/* 修改密码 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4 mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">修改密码</h3>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            {showPasswordForm ? '取消' : '修改'}
          </button>
        </div>

        {showPasswordForm && (
          <div className="space-y-4 pt-2 border-t border-gray-100 animate-slide-up">
            <div className="space-y-2">
              <Label htmlFor="old-password">当前密码</Label>
              <Input
                id="old-password"
                type="password"
                placeholder="输入当前密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="至少 8 个字符"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? '修改中...' : '确认修改密码'}
            </Button>
          </div>
        )}
      </div>

      {/* 危险操作 */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 space-y-4 mt-6">
        <h3 className="font-semibold text-red-600">危险操作</h3>
        <p className="text-sm text-gray-500">
          注销账号后，你的所有排行榜和条目将被永久删除，此操作不可恢复。
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          注销账号
        </Button>
      </div>

      {/* 删除账号确认弹窗 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认注销账号"
        message={`此操作不可恢复。你的所有排行榜、条目和个人数据将被永久删除。请输入你的用户名「${user.username}」以确认。`}
        confirmText="确认注销"
        cancelText="取消"
        variant="danger"
        requireInput={user.username}
        inputValue={deleteInputValue}
        onInputChange={setDeleteInputValue}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteInputValue('')
        }}
      />
    </div>
  )
}
