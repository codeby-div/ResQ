import Skeleton from "./Skeleton"

export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="h-9 w-20 rounded" />
      <Skeleton className="h-3 w-32 rounded" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-3 border-b border-border dark:border-border-dark">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded" />
      ))}
    </div>
  )
}
