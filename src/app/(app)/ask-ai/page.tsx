import { createClient } from '@/lib/supabase/server'
import { AIChatInterface } from '@/components/ai-chat-interface'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Settings, MessageSquare } from 'lucide-react'
import type { UserAISettings } from '@/types/database'

export default async function AskAIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's AI settings
  const { data: settings } = await supabase
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single() as { data: UserAISettings | null }

  // Get the API key for the default provider
  let provider = 'openai'
  let hasApiKey = false
  let model = ''

  if (settings) {
    provider = settings.default_provider
    switch (settings.default_provider) {
      case 'openai':
        hasApiKey = !!settings.openai_api_key
        model = settings.openai_model
        break
      case 'anthropic':
        hasApiKey = !!settings.anthropic_api_key
        model = settings.anthropic_model
        break
      case 'google':
        hasApiKey = !!settings.google_api_key
        model = settings.google_model
        break
    }
  }

  // Get recent chat history (last conversation)
  const { data: chatHistory } = await supabase
    .from('ai_chat_history')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1) as { data: Array<{ messages: unknown }> | null }

  // Extract messages from the last conversation
  const lastMessages = (chatHistory?.[0]?.messages || []) as Array<{ role: string; content: string }>

  if (!settings || !hasApiKey) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-amber-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Configure AI Settings
              </h2>
              <p className="text-gray-500 mt-2">
                Add your AI API key to start chatting with your Latin tutor.
              </p>
            </div>

            <Button asChild>
              <Link href="/profile/settings">
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] pb-20 lg:pb-0">
      <AIChatInterface
        initialHistory={lastMessages}
        provider={provider}
        model={model}
      />
    </div>
  )
}
