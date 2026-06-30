import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBar } from '../StatusBar'

describe('StatusBar', () => {
  it('renders entry count', () => {
    render(<StatusBar saveStatus="idle" isDirty={false} entryCount={12} />)
    expect(screen.getByText('共 12 项')).toBeInTheDocument()
  })

  it('shows "已就绪" when idle and not dirty', () => {
    render(<StatusBar saveStatus="idle" isDirty={false} entryCount={0} />)
    expect(screen.getByText('已就绪')).toBeInTheDocument()
  })

  it('shows "未保存" when idle and dirty', () => {
    render(<StatusBar saveStatus="idle" isDirty={true} entryCount={0} />)
    expect(screen.getByText('未保存')).toBeInTheDocument()
  })

  it('shows "保存中..." when saving', () => {
    render(<StatusBar saveStatus="saving" isDirty={true} entryCount={0} />)
    expect(screen.getByText('保存中...')).toBeInTheDocument()
    // Saving indicator should have a spinning icon
    const svg = document.querySelector('svg.animate-spin')
    expect(svg).toBeInTheDocument()
  })

  it('shows "已保存" when saved', () => {
    render(<StatusBar saveStatus="saved" isDirty={false} entryCount={0} />)
    expect(screen.getByText('已保存')).toBeInTheDocument()
    // Saved indicator should have a checkmark icon
    const checkSvg = document.querySelector('svg path[d="M20 6L9 17l-5-5"]')
    expect(checkSvg).toBeInTheDocument()
  })

  it('shows "保存失败" when error', () => {
    render(<StatusBar saveStatus="error" isDirty={true} entryCount={0} />)
    expect(screen.getByText('保存失败')).toBeInTheDocument()
    // Error indicator should have an X icon
    const xSvg = document.querySelector('svg circle[cx="12"][cy="12"][r="10"]')
    expect(xSvg).toBeInTheDocument()
  })

  it('renders drag hint text', () => {
    render(<StatusBar saveStatus="idle" isDirty={false} entryCount={0} />)
    expect(screen.getByText('拖拽条目进行排序')).toBeInTheDocument()
  })
})
