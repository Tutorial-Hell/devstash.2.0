import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getProfileData } from "@/lib/db/profile"
import { UserAvatar } from "@/components/user-avatar"
import { iconMap } from "@/lib/icon-map"
import { File, Package, FolderOpen, CalendarDays } from "lucide-react"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const profile = await getProfileData(session.user.id)

  const memberSince = profile.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account</p>
      </div>

      {/* User info */}
      <section className="rounded-lg border border-border bg-card p-6 flex items-center gap-5">
        <UserAvatar name={profile.name} image={profile.image} size="lg" />
        <div className="space-y-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {profile.name ?? "No name"}
          </p>
          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Member since {memberSince}</span>
          </div>
        </div>
      </section>

      {/* Usage stats */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Usage</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.totalItems}</p>
              <p className="text-xs text-muted-foreground">Total items</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-purple-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.totalCollections}</p>
              <p className="text-xs text-muted-foreground">Collections</p>
            </div>
          </div>
        </div>

        {/* Item type breakdown */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            By type
          </p>
          <div className="space-y-2">
            {profile.itemTypeBreakdown.map((t) => {
              const Icon = iconMap[t.icon] ?? File
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${t.color}20` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: t.color }} />
                  </div>
                  <span className="text-sm text-foreground capitalize flex-1">{t.name}</span>
                  <span className="text-sm font-medium text-foreground">{t.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}
