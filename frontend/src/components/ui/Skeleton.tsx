interface Props {
  className?: string
  count?: number
}

export default function Skeleton({ className = "h-4 w-full", count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-shimmer rounded bg-surface2 dark:bg-surface2-dark ${className}`}
        />
      ))}
    </>
  )
}
