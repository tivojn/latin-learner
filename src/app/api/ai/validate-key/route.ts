import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai/providers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, apiKey } = await request.json()

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Missing provider or API key' }, { status: 400 })
    }

    // Validate the API key by making a minimal request
    const isValid = await validateApiKeyWithProvider(provider as AIProvider, apiKey)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('API key validation error:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}

async function validateApiKeyWithProvider(provider: AIProvider, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        })
        return response.ok
      }

      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-3-5-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        })
        // 200 OK or 400 (bad request but key is valid) are both acceptable
        return response.ok || response.status === 400
      }

      case 'google': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        )
        return response.ok
      }

      default:
        return false
    }
  } catch {
    return false
  }
}
