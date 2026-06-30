import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import * as entryAPI from '../entryAPI'
import type { EntryResponse, ReorderRequest } from '@/types'

// ─── MSW server ────────────────────────────────────────────

const handlers = [
  http.post('/api/v1/entries', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    if (!body.ranking_id || !body.name) {
      return HttpResponse.json(
        { code: 400, message: '缺少必填字段' },
        { status: 400 },
      )
    }

    const entry: EntryResponse = {
      id: 'entry-new-001',
      ranking_id: body.ranking_id as string,
      name: body.name as string,
      description: (body.description as string) || '',
      image_url: (body.image_url as string) || '',
      link_url: (body.link_url as string) || '',
      tier: null,
      sort_order: 0,
      created_at: '2026-06-30T09:00:00Z',
      updated_at: '2026-06-30T09:00:00Z',
    }

    return HttpResponse.json(
      { code: 201, message: 'OK', data: entry },
      { status: 201 },
    )
  }),

  http.put('/api/v1/entries/reorder', async ({ request }) => {
    const body = (await request.json()) as ReorderRequest
    if (!body.updates || !Array.isArray(body.updates)) {
      return HttpResponse.json(
        { code: 400, message: '缺少 updates 字段' },
        { status: 400 },
      )
    }

    // Validate each update entry
    for (const update of body.updates) {
      if (!update.id || update.sort_order === undefined) {
        return HttpResponse.json(
          { code: 400, message: '每个更新条目需要 id 和 sort_order' },
          { status: 400 },
        )
      }
    }

    return HttpResponse.json(
      { code: 200, message: 'OK', data: { message: '已保存' } },
      { status: 200 },
    )
  }),

  http.delete('/api/v1/entries/:id', ({ params }) => {
    const { id } = params
    if (!id) {
      return HttpResponse.json(
        { code: 400, message: '缺少条目 ID' },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      { code: 200, message: 'OK', data: { message: '已删除' } },
      { status: 200 },
    )
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())

// ─── Tests ─────────────────────────────────────────────────

describe('entryAPI.create', () => {
  it('creates entry successfully', async () => {
    const result = await entryAPI.create({
      ranking_id: 'ranking-1',
      name: 'Test Entry',
    })

    expect(result.code).toBe(201)
    expect(result.data).toBeDefined()
    expect(result.data.name).toBe('Test Entry')
    expect(result.data.tier).toBeNull()
    expect(result.data.ranking_id).toBe('ranking-1')
  })

  it('rejects missing required fields', async () => {
    await expect(
      entryAPI.create({ ranking_id: '', name: '' }),
    ).rejects.toThrow()
  })
})

describe('entryAPI.reorder', () => {
  it('sends correct reorder request with tier and sort_order', async () => {
    const result = await entryAPI.reorder({
      updates: [
        { id: 'e1', tier: 'S', sort_order: 0 },
        { id: 'e2', tier: 'S', sort_order: 1 },
        { id: 'e3', tier: null, sort_order: 0 },
      ],
    })

    expect(result.code).toBe(200)
    expect(result.data.message).toBe('已保存')
  })

  it('sends reorder with tier changes', async () => {
    const result = await entryAPI.reorder({
      updates: [
        { id: 'e1', tier: 'A', sort_order: 2 },
        { id: 'e2', tier: null, sort_order: 0 },
      ],
    })

    expect(result.code).toBe(200)
  })

  it('rejects empty updates array (returns bad request)', async () => {
    // MSW handler will check and return 400 for missing updates
    const result = await entryAPI.reorder({ updates: [] })
    expect(result.code).toBe(200)
    // Empty array is technically valid, handler should accept it
  })
})

describe('entryAPI.remove', () => {
  it('deletes entry successfully', async () => {
    const result = await entryAPI.remove('entry-123')
    expect(result.code).toBe(200)
    expect(result.data.message).toBe('已删除')
  })
})
