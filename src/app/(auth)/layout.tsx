import { Toaster } from "sonner"
import { Navbar } from "@/components/marketing/navbar"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-[88px]">
        {children}
      </div>
      <Toaster position="top-center" />
    </div>
  )
}
