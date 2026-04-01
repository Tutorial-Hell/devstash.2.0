import { Toaster } from "sonner"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {children}
      <Toaster position="top-center" />
    </div>
  )
}
