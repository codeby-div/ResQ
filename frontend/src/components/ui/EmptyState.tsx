interface Props {
  icon?: React.ReactNode
  heading: string
  subtext?: string
}

export default function EmptyState({ icon, heading, subtext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-tertiary dark:text-tertiary-dark mb-3">{icon}</div>}
      <h3 className="text-sm font-medium text-primary dark:text-primary-dark">{heading}</h3>
      {subtext && <p className="text-xs text-secondary dark:text-secondary-dark mt-1">{subtext}</p>}
    </div>
  )
}
