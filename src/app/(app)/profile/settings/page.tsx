import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Get AI settings
  const { data: aiSettings } = await supabase
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="space-y-8 pb-20 lg:pb-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize your learning experience
        </p>
      </div>

      <SettingsForm
        userId={user!.id}
        profile={profile}
        aiSettings={aiSettings}
      />
    </div>
  )
}
