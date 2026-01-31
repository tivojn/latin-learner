import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type AIProvider } from '@/lib/ai/providers'
import type { UserAISettings } from '@/types/database'

const SYSTEM_PROMPT = `You are a helpful Latin tutor assistant for the Latin Learner app. Your role is to:
- Help students understand Latin vocabulary, grammar, and syntax
- Explain the meaning and etymology of Latin words
- Provide example sentences aligned with the Cambridge Latin Course
- Suggest memory techniques (mnemonics) for vocabulary
- Explain English derivatives from Latin roots
- Answer questions about Roman culture and history when relevant to language learning

Keep responses clear, educational, and encouraging. Use simple explanations appropriate for IGCSE-level students.`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', user.id)
      .single() as { data: UserAISettings | null }

    if (!settings) {
      return NextResponse.json(
        { error: 'Please configure your AI settings first' },
        { status: 400 }
      )
    }

    // Get the API key and model for the default provider
    const provider = settings.default_provider as AIProvider
    let apiKey: string | null = null
    let model: string = ''

    switch (provider) {
      case 'openai':
        apiKey = settings.openai_api_key
        model = settings.openai_model
        break
      case 'anthropic':
        apiKey = settings.anthropic_api_key
        model = settings.anthropic_model
        break
      case 'google':
        apiKey = settings.google_api_key
        model = settings.google_model
        break
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `Please add your ${provider} API key in settings` },
        { status: 400 }
      )
    }

    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Call the appropriate AI provider
    const response = await callAIProvider(
      provider,
      model,
      apiKey,
      message,
      conversationHistory || []
    )

    // Save chat history
    const messages = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: response },
    ]

    // Save chat history (ignoring type errors from untyped Supabase client)
    await (supabase.from('ai_chat_history') as any).insert({
      user_id: user.id,
      provider_used: provider,
      model_used: model,
      messages: messages,
      tokens_used: 0, // Could be calculated from response
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

async function callAIProvider(
  provider: AIProvider,
  model: string,
  apiKey: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const messages = [
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message },
  ]

  switch (provider) {
    case 'openai': {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
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
          model,
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`)
      }

      const data = await response.json()
      return data.content[0].text
    }

    case 'google': {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT },
                  ...messages.map(m => ({ text: `${m.role}: ${m.content}` })),
                ],
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    }

    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
