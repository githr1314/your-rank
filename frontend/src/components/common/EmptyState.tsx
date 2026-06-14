import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionText?: string
  actionLink?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionText,
  actionLink,
  onAction,
}: EmptyStateProps) {
  const renderAction = () => {
    if (!actionText) return null

    if (actionLink) {
      return (
        <Link to={actionLink} className="mt-4 inline-flex">
          <Button>{actionText}</Button>
        </Link>
      )
    }

    if (onAction) {
      return (
        <Button onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <span className="text-6xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-sm text-center">{description}</p>
      )}
      {renderAction()}
    </div>
  )
}
