interface Props {
  message: string
  detail?: string
  icon?: React.ReactNode
  padding?: "p-8" | "p-12"
}

export function EmptyState({ message, detail, icon, padding = "p-8" }: Props) {
  return (
    <div className={`rounded-lg border border-border bg-card ${padding} text-center`}>
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
      {detail && <p className="text-xs text-muted-foreground/60 mt-1">{detail}</p>}
    </div>
  )
}
