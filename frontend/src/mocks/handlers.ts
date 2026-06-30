import { http, HttpResponse } from 'msw'
import type { CategoryEnum, VisibilityEnum } from '@/types'
import type { EntryResponse } from '@/types'

// ─── Mock helpers ─────────────────────────────────────────

function buildMockEntries(rankingId: string): EntryResponse[] {
  const entryNames = [
    { name: '艾尔登法环', tier: 'S' as const },
    { name: '塞尔达传说', tier: 'S' as const },
    { name: '巫师 3', tier: 'S' as const },
    { name: '战神', tier: 'A' as const },
    { name: '最后生还者', tier: 'A' as const },
    { name: '地平线', tier: 'A' as const },
    { name: '对马岛之魂', tier: 'B' as const },
    { name: '蜘蛛侠', tier: 'B' as const },
    { name: '星际战甲', tier: 'C' as const },
    { name: '原神', tier: 'D' as const },
    { name: '未分类条目 1', tier: null },
    { name: '未分类条目 2', tier: null },
  ]

  return entryNames.map((item, idx) => ({
    id: `entry-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
    ranking_id: rankingId,
    name: item.name,
    description: '',
    image_url: item.tier ? `https://picsum.photos/seed/entry${idx}/400/300` : '',
    link_url: '',
    tier: item.tier,
    sort_order: idx,
    created_at: '2026-06-30T08:00:00Z',
    updated_at: '2026-06-30T08:30:00Z',
  }))
}

// ─── Mock data store ─────────────────────────────────────

const mockUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const mockUser = {
  id: mockUserId,
  username: 'demo_user',
  email: 'demo@example.com',
  nickname: 'Demo 用户',
  avatar_url: '',
  bio: '一个喜欢做排行的用户',
  last_login_at: new Date().toISOString(),
}

function generateMockRankings() {
  const categories = ['游戏', '影视', '音乐', '美食', '运动', '科技', '其他'] as const
  const visibilities = ['公开', '私密', '仅链接'] as const
  const titles = [
    '2026 年度最佳游戏排行',
    '我最爱的动漫角色 TOP 榜',
    '值得反复观看的电影',
    '各地美食推荐排行',
    '必听的华语金曲',
    '运动项目难度排行',
    '最值得入手的数码产品',
    '经典 RPG 游戏排行',
  ]

  return titles.map((title, idx) => {
    const entryCount = Math.floor(Math.random() * 15) + 3
    const tiers = ['S', 'A', 'B', 'C', 'D'] as const
    const tierSummary: Record<string, number> = {}
    let remaining = entryCount
    tiers.forEach((tier) => {
      if (tier === 'D') {
        tierSummary[tier] = remaining
      } else {
        const count = Math.floor(Math.random() * (remaining / (5 - tiers.indexOf(tier)))) + 1
        tierSummary[tier] = count
        remaining -= count
      }
    })

    const now = new Date()
    const createdOffset = idx * 3600000 * 24 * (Math.floor(Math.random() * 7) + 1)
    const updatedOffset = createdOffset - Math.floor(Math.random() * 3600000 * 24 * 3)

    return {
      id: `ranking-${idx + 1}-${crypto.randomUUID().slice(0, 8)}`,
      user_id: mockUserId,
      title,
      description: `这里是 "${title}" 的详细说明，展示了我的个人评价和推荐理由。`,
      cover_url: '',
      category: categories[idx % categories.length],
      visibility: visibilities[idx % visibilities.length],
      share_code: Math.random().toString(36).slice(2, 10),
      view_count: Math.floor(Math.random() * 1000),
      entry_count: entryCount,
      tier_summary: tierSummary,
      created_at: new Date(now.getTime() - createdOffset).toISOString(),
      updated_at: new Date(now.getTime() - updatedOffset).toISOString(),
      user: mockUser,
    }
  })
}

const mockRankings = generateMockRankings()

export const handlers = [
  // ─── Auth ─────────────────────────────────────────────

  // POST /auth/send-verify-code — 后端待实现，使用 MSW mock
  http.post('/api/v1/auth/send-verify-code', async ({ request }) => {
    const body = (await request.json()) as { email?: string }
    if (!body?.email) {
      return HttpResponse.json({ code: 400, message: '请输入邮箱地址' }, { status: 400 })
    }
    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: { message: '验证码已发送', expires_in: 600 },
      },
      { status: 200 },
    )
  }),

  // POST /auth/login — mock 登录
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { account?: string; password?: string; remember_me?: boolean }
    if (!body?.account || !body?.password) {
      return HttpResponse.json({ code: 400, message: '请输入账号和密码' }, { status: 400 })
    }
    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: {
          token: 'mock-jwt-token-for-development',
          user: mockUser,
        },
      },
      { status: 200 },
    )
  }),

  // POST /auth/register — mock 注册
  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { username?: string; email?: string; password?: string; verify_code?: string }
    if (!body?.username || !body?.email || !body?.password || !body?.verify_code) {
      return HttpResponse.json({ code: 400, message: '请填写完整注册信息' }, { status: 400 })
    }
    return HttpResponse.json(
      {
        code: 201,
        message: 'OK',
        data: {
          token: 'mock-jwt-token-for-development',
          user: { ...mockUser, username: body.username, email: body.email },
        },
      },
      { status: 201 },
    )
  }),

  // ─── Rankings ─────────────────────────────────────────

  // GET /rankings/public — 公开排行榜列表（发现页）
  http.get('/api/v1/rankings/public', ({ request }) => {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const category = url.searchParams.get('category')
    const keyword = url.searchParams.get('keyword')

    let filtered = [...mockRankings]

    // Filter by visibility — 只返回公开的
    filtered = filtered.filter((r) => r.visibility === '公开')

    // Filter by category
    if (category) {
      filtered = filtered.filter((r) => r.category === category)
    }

    // Filter by keyword (标题搜索)
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter((r) => r.title.toLowerCase().includes(kw))
    }

    // Sort by updated_at desc
    filtered.sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: {
          items: paginated,
          total,
        },
      },
      { status: 200 },
    )
  }),

  // GET /rankings/mine — 我的排行榜列表
  http.get('/api/v1/rankings/mine', ({ request }) => {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const category = url.searchParams.get('category')
    const sortBy = url.searchParams.get('sort_by') || 'updated_at'

    let filtered = [...mockRankings]

    // Filter by category
    if (category && category !== '全部') {
      filtered = filtered.filter((r) => r.category === category)
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a[sortBy === 'created_at' ? 'created_at' : 'updated_at']).getTime()
      const dateB = new Date(b[sortBy === 'created_at' ? 'created_at' : 'updated_at']).getTime()
      return dateB - dateA
    })

    const paginated = filtered.slice(offset, offset + limit)

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: {
          items: paginated,
          total: filtered.length,
        },
      },
      { status: 200 },
    )
  }),

  // POST /rankings — 创建排行榜
  http.post('/api/v1/rankings', async ({ request }) => {
    const body = (await request.json()) as {
      title?: string
      description?: string
      cover_url?: string
      category?: string
      visibility?: string
    }

    if (!body?.title?.trim()) {
      return HttpResponse.json({ code: 400, message: '标题不能为空' }, { status: 400 })
    }

    if (body.title.length > 100) {
      return HttpResponse.json({ code: 400, message: '标题不能超过 100 个字符' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const newRanking = {
      id: `ranking-${crypto.randomUUID().slice(0, 8)}`,
      user_id: mockUserId,
      title: body.title,
      description: body.description || '',
      cover_url: body.cover_url || '',
      category: (body.category || '其他') as CategoryEnum,
      visibility: (body.visibility || '公开') as VisibilityEnum,
      share_code: Math.random().toString(36).slice(2, 10),
      view_count: 0,
      created_at: now,
      updated_at: now,
      entries: [],
      user: mockUser,
    }

    // Add to mock store
    mockRankings.unshift({
      id: newRanking.id,
      user_id: newRanking.user_id,
      title: newRanking.title,
      description: newRanking.description,
      cover_url: newRanking.cover_url,
      category: newRanking.category as CategoryEnum,
      visibility: newRanking.visibility as VisibilityEnum,
      share_code: newRanking.share_code,
      view_count: newRanking.view_count,
      entry_count: 0,
      tier_summary: { S: 0, A: 0, B: 0, C: 0, D: 0 },
      created_at: newRanking.created_at,
      updated_at: newRanking.updated_at,
      user: mockUser,
    })

    return HttpResponse.json(
      {
        code: 201,
        message: 'OK',
        data: newRanking,
      },
      { status: 201 },
    )
  }),

  // DELETE /rankings/{id} — 删除排行榜
  http.delete('/api/v1/rankings/:id', ({ params }) => {
    const { id } = params
    const index = mockRankings.findIndex((r) => r.id === id)

    if (index === -1) {
      return HttpResponse.json({ code: 404, message: '排行榜不存在' }, { status: 404 })
    }

    mockRankings.splice(index, 1)

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: { message: '已删除' },
      },
      { status: 200 },
    )
  }),

  // POST /upload — 单张图片上传
  http.post('/api/v1/upload', async ({ request }) => {
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return HttpResponse.json({ code: 400, message: '请上传图片文件' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        code: 201,
        message: 'OK',
        data: {
          url: 'https://picsum.photos/seed/mock/800/600',
          thumb_s_url: 'https://picsum.photos/seed/mock/200/150',
          thumb_m_url: 'https://picsum.photos/seed/mock/800/600',
          file_name: 'mock-upload.jpg',
          file_size: 102400,
          mime_type: 'image/jpeg',
          width: 800,
          height: 600,
        },
      },
      { status: 201 },
    )
  }),

  // GET /rankings/{id} — 排行榜详情（含条目）
  http.get('/api/v1/rankings/:id', ({ params }) => {
    const { id } = params
    if (typeof id !== 'string') {
      return HttpResponse.json({ code: 400, message: '无效的排行榜 ID' }, { status: 400 })
    }

    // Try to find in existing rankings, or create a detail response
    const card = mockRankings.find((r) => r.id === id)

    const detail = {
      id: id,
      user_id: mockUserId,
      title: card?.title || '2026 年度最佳游戏排行',
      description: card?.description || '经过一整年的深度体验，这是我对今年所有游戏的客观评价。',
      cover_url: card?.cover_url || 'https://picsum.photos/seed/cover/800/400',
      category: card?.category || '游戏',
      visibility: card?.visibility || '公开',
      share_code: card?.share_code || 'abc12345',
      view_count: (card?.view_count || 0) + 1,
      created_at: card?.created_at || '2026-06-29T12:00:00Z',
      updated_at: card?.updated_at || '2026-06-30T08:30:00Z',
      entries: buildMockEntries(id as string),
      user: mockUser,
    }

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: detail,
      },
      { status: 200 },
    )
  }),

  // GET /share/{code} — 通过分享码获取排行
  http.get('/api/v1/share/:code', ({ params }) => {
    const { code } = params
    if (typeof code !== 'string' || code.length !== 8) {
      return HttpResponse.json({ code: 400, message: '无效的分享码' }, { status: 400 })
    }

    // Find ranking by share code in mock data
    const ranking = mockRankings.find((r) => r.share_code === code)

    if (!ranking) {
      return HttpResponse.json(
        { code: 404, message: '排行榜不存在或已删除' },
        { status: 404 },
      )
    }

    const detail = {
      ...ranking,
      entries: buildMockEntries(ranking.id),
      user: mockUser,
    }

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: detail,
      },
      { status: 200 },
    )
  }),

  // ─── Profile ─────────────────────────────────────────

  // PUT /profile — 更新个人资料
  http.put('/api/v1/profile', async ({ request }) => {
    const body = (await request.json()) as {
      nickname?: string
      bio?: string
      avatar_url?: string
    }

    if (body.nickname !== undefined && body.nickname.length > 50) {
      return HttpResponse.json(
        { code: 400, message: '昵称不能超过 50 个字符' },
        { status: 400 },
      )
    }
    if (body.bio !== undefined && body.bio.length > 500) {
      return HttpResponse.json(
        { code: 400, message: '简介不能超过 500 个字符' },
        { status: 400 },
      )
    }

    // Apply updates to the shared mockUser
    const updated = { ...mockUser }
    if (body.nickname !== undefined) updated.nickname = body.nickname
    if (body.bio !== undefined) updated.bio = body.bio
    if (body.avatar_url !== undefined) updated.avatar_url = body.avatar_url
    Object.assign(mockUser, updated)

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: { ...updated },
      },
      { status: 200 },
    )
  }),

  // PUT /profile/password — 修改密码
  http.put('/api/v1/profile/password', async ({ request }) => {
    const body = (await request.json()) as {
      old_password?: string
      new_password?: string
    }

    if (!body.old_password) {
      return HttpResponse.json(
        { code: 400, message: '请输入当前密码' },
        { status: 400 },
      )
    }
    if (!body.new_password || body.new_password.length < 8) {
      return HttpResponse.json(
        { code: 400, message: '新密码至少 8 个字符' },
        { status: 400 },
      )
    }
    if (body.new_password.length > 32) {
      return HttpResponse.json(
        { code: 400, message: '新密码不能超过 32 个字符' },
        { status: 400 },
      )
    }

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: { message: '密码修改成功' },
      },
      { status: 200 },
    )
  }),

  // DELETE /profile — 注销账号（需 confirm: true）
  http.delete('/api/v1/profile', async ({ request }) => {
    const body = (await request.json()) as { confirm?: boolean }

    if (!body?.confirm) {
      return HttpResponse.json(
        { code: 400, message: '请确认注销操作' },
        { status: 400 },
      )
    }

    return HttpResponse.json(
      {
        code: 200,
        message: 'OK',
        data: { message: '账号已注销' },
      },
      { status: 200 },
    )
  }),
]
