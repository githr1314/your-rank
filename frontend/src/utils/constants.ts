import type { Category, Tier, Visibility } from '@/types'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: '游戏', label: '🎮 游戏' },
  { value: '影视', label: '🎬 影视' },
  { value: '音乐', label: '🎵 音乐' },
  { value: '美食', label: '🍜 美食' },
  { value: '运动', label: '⚽ 运动' },
  { value: '科技', label: '💻 科技' },
  { value: '其他', label: '📦 其他' },
]

export const VISIBILITIES: { value: Visibility; label: string; desc: string }[] = [
  { value: '公开', label: '公开', desc: '出现在发现页，可被搜索' },
  { value: '仅链接', label: '仅链接可见', desc: '知道链接的人才能查看' },
  { value: '私密', label: '私密', desc: '仅自己可见' },
]

export const TIER_INFO: Record<Tier, { name: string; emoji: string; cssClass: string; badgeClass: string }> = {
  S: { name: '神中神', emoji: '👑', cssClass: 'tier-row-s', badgeClass: 'tier-badge-s' },
  A: { name: '杀疯了', emoji: '🔥', cssClass: 'tier-row-a', badgeClass: 'tier-badge-a' },
  B: { name: '有点料', emoji: '⚡', cssClass: 'tier-row-b', badgeClass: 'tier-badge-b' },
  C: { name: '还行吧', emoji: '✓', cssClass: 'tier-row-c', badgeClass: 'tier-badge-c' },
  D: { name: '凑个数', emoji: '🫧', cssClass: 'tier-row-d', badgeClass: 'tier-badge-d' },
}

export const TIER_ORDER: Tier[] = ['S', 'A', 'B', 'C', 'D']

export const MAX_RANKING_TITLE = 100
export const MAX_ENTRY_NAME = 200
export const MAX_ENTRIES_PER_RANKING = 100
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
