import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

// Mock Radix Dialog's Portal to render in place
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('ConfirmDialog', () => {
  it('renders title and description', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="确认删除"
        description="确定要删除吗？此操作不可恢复。"
        confirmText="删除"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText('确认删除')).toBeInTheDocument()
    expect(
      screen.getByText('确定要删除吗？此操作不可恢复。'),
    ).toBeInTheDocument()
  })

  it('renders confirm button with correct text', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="确认"
        description="请确认操作"
        confirmText="确认删除"
        onConfirm={vi.fn()}
      />,
    )

    // Use getByRole to find the button specifically (not the title)
    const confirmBtn = screen.getByRole('button', { name: /确认删除/ })
    expect(confirmBtn).toBeInTheDocument()
  })

  it('renders cancel button', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="确认"
        description="请确认操作"
        confirmText="确认"
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /取消/ })).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="请确认"
        description="确认操作"
        confirmText="确认删除"
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /确认删除/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange when cancel button clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="请确认"
        description="确认操作"
        confirmText="确认"
        onConfirm={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /取消/ }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows danger variant styling when variant is danger', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="删除"
        description="危险操作"
        confirmText="删除"
        onConfirm={vi.fn()}
        variant="danger"
      />,
    )

    const confirmBtn = screen.getByRole('button', { name: /删除/ })
    expect(confirmBtn.className).toContain('bg-error')
  })

  it('shows disabled loading state when isLoading', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="删除中"
        description="处理中..."
        confirmText="删除"
        onConfirm={vi.fn()}
        isLoading={true}
      />,
    )

    // When loading, button text changes to "处理中..."
    const loadingBtn = screen.getByRole('button', { name: /处理中/ })
    expect(loadingBtn).toBeDisabled()
  })

  it('renders with required input for title confirmation', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="删除排行"
        description="请输入排行标题以确认删除"
        confirmText="删除"
        onConfirm={vi.fn()}
        requireInput="我的排行"
      />,
    )

    // Should have an input field with the required value as placeholder
    const input = screen.getByPlaceholderText('我的排行')
    expect(input).toBeInTheDocument()
  })
})
