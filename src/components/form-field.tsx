export function FormField({
  label,
  required,
  children,
  spacing = "tight",
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  spacing?: "tight" | "normal"
}) {
  return (
    <div className={spacing === "tight" ? "space-y-1" : "space-y-1.5"}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  )
}
