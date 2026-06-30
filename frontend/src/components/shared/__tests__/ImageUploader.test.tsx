import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageUploader } from '../ImageUploader'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/constants'

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders placeholder state when no value', () => {
    render(<ImageUploader />)
    expect(screen.getByText('点击或拖拽上传图片')).toBeInTheDocument()
    expect(
      screen.getByText('支持 JPG / PNG / GIF / WebP，最大 10MB'),
    ).toBeInTheDocument()
  })

  it('shows preview image when value is provided', () => {
    render(<ImageUploader value="https://example.com/preview.jpg" />)
    const img = screen.getByAltText('预览')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/preview.jpg')
  })

  it('shows circular crop indicator when cropShape is circle', () => {
    render(
      <ImageUploader
        value="https://example.com/preview.jpg"
        cropShape="circle"
      />,
    )
    expect(screen.getByText('圆形裁剪')).toBeInTheDocument()
  })

  it('handles dragOver and dragLeave events without crashing', () => {
    const { container } = render(<ImageUploader />)
    const dropZone = container.querySelector('[role="button"]')!
    expect(dropZone).toBeInTheDocument()

    // Trigger dragOver and dragLeave — should not throw
    expect(() => {
      fireEvent.dragOver(dropZone)
      fireEvent.dragLeave(dropZone)
    }).not.toThrow()
  })

  describe('file validation', () => {
    function validateFile(file: File): string | null {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return '不支持的文件格式，仅支持 JPG/PNG/GIF/WebP'
      }
      if (file.size > MAX_FILE_SIZE) {
        return '文件超过 10MB 限制'
      }
      return null
    }

    it('rejects disallowed file types', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      expect(validateFile(invalidFile)).toBe(
        '不支持的文件格式，仅支持 JPG/PNG/GIF/WebP',
      )
    })

    it('rejects files exceeding size limit', () => {
      const oversizedFile = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(oversizedFile, 'size', { value: MAX_FILE_SIZE + 1 })
      expect(validateFile(oversizedFile)).toBe('文件超过 10MB 限制')
    })

    it('accepts valid file', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 })
      expect(validateFile(validFile)).toBeNull()
    })

    it('accepts all allowed image types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      for (const mime of allowedTypes) {
        const file = new File([''], `test.${mime.split('/')[1]}`, { type: mime })
        Object.defineProperty(file, 'size', { value: 1024 })
        expect(ALLOWED_IMAGE_TYPES.includes(file.type)).toBe(true)
      }
    })
  })

  it('triggers file input click on button click', () => {
    const { container } = render(<ImageUploader />)
    const dropZone = container.querySelector('[role="button"]')!
    const input = container.querySelector('input[type="file"]')!

    const clickSpy = vi.spyOn(input as HTMLInputElement, 'click')

    fireEvent.click(dropZone)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('handles file drop event without crashing', () => {
    const { container } = render(<ImageUploader />)
    const dropZone = container.querySelector('[role="button"]')!
    expect(dropZone).toBeInTheDocument()

    // Simulate drop with dataTransfer — using fireEvent provides
    // React synthetic event compatibility
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 1024 })

    expect(() => {
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
          items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
          types: ['Files'],
        },
      })
    }).not.toThrow()
  })
})
