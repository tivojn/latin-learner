// AI Provider Configuration
// Supports OpenAI, Anthropic (Claude), and Google (Gemini)

export type AIProvider = 'openai' | 'anthropic' | 'google'

export interface AIModel {
  id: string
  name: string
  description: string
  contextWindow: number
  inputCost: number  // per 1M tokens
  outputCost: number // per 1M tokens
}

export interface AIProviderConfig {
  id: AIProvider
  name: string
  apiKeyPrefix: string
  models: AIModel[]
  defaultModel: string
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiKeyPrefix: 'sk-',
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable model, best for complex tasks',
        contextWindow: 128000,
        inputCost: 2.50,
        outputCost: 10.00,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and affordable for simpler tasks',
        contextWindow: 128000,
        inputCost: 0.15,
        outputCost: 0.60,
      },
      {
        id: 'o1',
        name: 'o1',
        description: 'Advanced reasoning model',
        contextWindow: 200000,
        inputCost: 15.00,
        outputCost: 60.00,
      },
      {
        id: 'o1-mini',
        name: 'o1-mini',
        description: 'Efficient reasoning model',
        contextWindow: 128000,
        inputCost: 3.00,
        outputCost: 12.00,
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    apiKeyPrefix: 'sk-ant-',
    defaultModel: 'claude-sonnet-4-20250514',
    models: [
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        description: 'Most capable Claude model for complex analysis',
        contextWindow: 200000,
        inputCost: 15.00,
        outputCost: 75.00,
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Balanced performance and cost',
        contextWindow: 200000,
        inputCost: 3.00,
        outputCost: 15.00,
      },
      {
        id: 'claude-haiku-3-5-20241022',
        name: 'Claude Haiku 3.5',
        description: 'Fast and efficient for simple tasks',
        contextWindow: 200000,
        inputCost: 0.80,
        outputCost: 4.00,
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    apiKeyPrefix: 'AI',
    defaultModel: 'gemini-2.0-flash',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Fast multimodal model',
        contextWindow: 1000000,
        inputCost: 0.10,
        outputCost: 0.40,
      },
      {
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite',
        description: 'Lightweight and cost-effective',
        contextWindow: 1000000,
        inputCost: 0.02,
        outputCost: 0.10,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning capabilities',
        contextWindow: 2000000,
        inputCost: 1.25,
        outputCost: 5.00,
      },
    ],
  },
}

export function getProviderConfig(provider: AIProvider): AIProviderConfig {
  return AI_PROVIDERS[provider]
}

export function getModelConfig(provider: AIProvider, modelId: string): AIModel | undefined {
  return AI_PROVIDERS[provider].models.find(m => m.id === modelId)
}

export function validateApiKey(provider: AIProvider, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) return false

  const config = AI_PROVIDERS[provider]

  // Basic prefix check
  if (provider === 'openai') {
    return apiKey.startsWith('sk-')
  }
  if (provider === 'anthropic') {
    return apiKey.startsWith('sk-ant-')
  }
  if (provider === 'google') {
    return apiKey.startsWith('AI') || apiKey.length > 30
  }

  return true
}
