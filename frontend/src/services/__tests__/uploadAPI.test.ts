import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import * as uploadAPI from '../uploadAPI'

const handlers = [
  http.post('/api/v1/upload', async ({ request }) => {
    const contentType = request.headers.get('Content-Type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return HttpResponse.json(
        { code: 400, message: '请上传图片文件' },
        { status: 400 },
      )
    }

    return HttpResponse.json(
      {
        code: 201,
        message: 'OK',
        data: {
          url: 'https://example.com/uploads/test.jpg',
          thumb_s_url: 'https://example.com/uploads/test_200w.jpg',
          thumb_m_url: 'https://example.com/uploads/test_800w.jpg',
          file_name: 'test.jpg',
          file_size: 102400,
          mime_type: 'image/jpeg',
          width: 800,
          height: 600,
        },
      },
      { status: 201 },
    )
  }),

  http.post('/api/v1/upload/batch', async () => {
    return HttpResponse.json(
      {
        code: 201,
        message: 'OK',
        data: [
          {
            url: 'https://example.com/uploads/img1.jpg',
            thumb_s_url: 'https://example.com/uploads/img1_200w.jpg',
            thumb_m_url: 'https://example.com/uploads/img1_800w.jpg',
            file_name: 'img1.jpg',
            file_size: 102400,
            mime_type: 'image/jpeg',
            width: 800,
            height: 600,
          },
          {
            url: 'https://example.com/uploads/img2.jpg',
            thumb_s_url: 'https://example.com/uploads/img2_200w.jpg',
            thumb_m_url: 'https://example.com/uploads/img2_800w.jpg',
            file_name: 'img2.jpg',
            file_size: 51200,
            mime_type: 'image/png',
            width: 400,
            height: 300,
          },
        ],
      },
      { status: 201 },
    )
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('uploadAPI.upload', () => {
  it('uploads a single file and returns upload response', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const result = await uploadAPI.upload(file)

    expect(result.code).toBe(201)
    expect(result.data).toBeDefined()
    expect(result.data.url).toContain('https://')
    expect(result.data.file_name).toBe('test.jpg')
    expect(result.data.mime_type).toBe('image/jpeg')
    expect(result.data.thumb_s_url).toBeTruthy()
    expect(result.data.thumb_m_url).toBeTruthy()
    expect(result.data.file_size).toBeGreaterThan(0)
    expect(result.data.width).toBeGreaterThan(0)
    expect(result.data.height).toBeGreaterThan(0)
  })
})

describe('uploadAPI.batchUpload', () => {
  it('uploads multiple files and returns array of upload responses', async () => {
    const files = [
      new File(['test1'], 'img1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'img2.png', { type: 'image/png' }),
    ]
    const result = await uploadAPI.batchUpload(files)

    expect(result.code).toBe(201)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data).toHaveLength(2)

    const [img1, img2] = result.data
    expect(img1.file_name).toBe('img1.jpg')
    expect(img2.file_name).toBe('img2.jpg')
    expect(img2.mime_type).toBe('image/png')
  })
})
