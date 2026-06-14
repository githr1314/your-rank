import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton'

export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <ShadcnSkeleton className={className} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <ShadcnSkeleton className="h-40 w-full !rounded-none" />
      <div className="p-4 space-y-3">
        <ShadcnSkeleton className="h-4 w-3/4" />
        <ShadcnSkeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-2">
          <ShadcnSkeleton className="h-8 flex-1 !rounded-lg" />
          <ShadcnSkeleton className="h-8 flex-1 !rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function TierRowSkeleton() {
  return (
    <div className="rounded-xl border-2 border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShadcnSkeleton className="h-5 w-5 !rounded-full" />
        <ShadcnSkeleton className="h-4 w-20" />
        <ShadcnSkeleton className="h-5 w-8 !rounded-full" />
      </div>
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 min-w-[140px]">
            <ShadcnSkeleton className="h-20 w-full !rounded-md mb-2" />
            <ShadcnSkeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
