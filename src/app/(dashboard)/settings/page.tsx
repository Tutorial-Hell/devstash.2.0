import { getProfileData } from "@/lib/db/profile"
import { requireUserId } from "@/lib/auth-utils"
import { ChangePasswordForm } from "@/app/(dashboard)/profile/change-password-form"
import { DeleteAccountDialog } from "@/app/(dashboard)/profile/delete-account-dialog"
import { EditorPreferencesForm } from "./editor-preferences-form"
import { BillingSection } from "@/components/settings/billing-section"
import { BackToDashboard } from "@/components/back-to-dashboard"

export default async function SettingsPage() {
  const userId = await requireUserId()
  const profile = await getProfileData(userId)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <BackToDashboard className="mb-3" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings</p>
      </div>

      {/* Billing */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Billing</h2>
        <div className="rounded-lg border border-border bg-card p-6">
          <BillingSection
            totalItems={profile.totalItems}
            totalCollections={profile.totalCollections}
          />
        </div>
      </section>

      {/* Editor preferences */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Editor preferences</h2>
        <div className="rounded-lg border border-border bg-card p-6">
          <EditorPreferencesForm />
        </div>
      </section>

      {/* Change password — only for credentials users */}
      {profile.hasPassword && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Change password</h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <ChangePasswordForm />
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Danger zone</h2>
        <div className="rounded-lg border border-destructive/30 bg-card p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <DeleteAccountDialog />
        </div>
      </section>
    </div>
  )
}
