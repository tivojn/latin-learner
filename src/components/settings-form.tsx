'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai/providers'
import type { Profile, UserAISettings } from '@/types/database'
import {
  User,
  Target,
  Bot,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  userId: string
  profile: Profile | null
  aiSettings: UserAISettings | null
}

export function SettingsForm({ userId, profile, aiSettings }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Profile state
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 20)

  // AI settings state
  const [provider, setProvider] = useState<AIProvider>(
    (aiSettings?.default_provider as AIProvider) || 'openai'
  )

  // Per-provider settings
  const [openaiKey, setOpenaiKey] = useState(aiSettings?.openai_api_key || '')
  const [openaiModel, setOpenaiModel] = useState(aiSettings?.openai_model || 'gpt-4o')
  const [anthropicKey, setAnthropicKey] = useState(aiSettings?.anthropic_api_key || '')
  const [anthropicModel, setAnthropicModel] = useState(aiSettings?.anthropic_model || 'claude-sonnet-4-20250514')
  const [googleKey, setGoogleKey] = useState(aiSettings?.google_api_key || '')
  const [googleModel, setGoogleModel] = useState(aiSettings?.google_model || 'gemini-2.0-flash')

  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [keyValid, setKeyValid] = useState<Record<AIProvider, boolean | null>>({
    openai: aiSettings?.openai_key_valid ?? null,
    anthropic: aiSettings?.anthropic_key_valid ?? null,
    google: aiSettings?.google_key_valid ?? null,
  })

  const [isSaving, setIsSaving] = useState(false)

  const currentProvider = AI_PROVIDERS[provider]

  const getCurrentKey = () => {
    switch (provider) {
      case 'openai': return openaiKey
      case 'anthropic': return anthropicKey
      case 'google': return googleKey
    }
  }

  const getCurrentModel = () => {
    switch (provider) {
      case 'openai': return openaiModel
      case 'anthropic': return anthropicModel
      case 'google': return googleModel
    }
  }

  const setCurrentKey = (key: string) => {
    switch (provider) {
      case 'openai': setOpenaiKey(key); break
      case 'anthropic': setAnthropicKey(key); break
      case 'google': setGoogleKey(key); break
    }
  }

  const setCurrentModel = (model: string) => {
    switch (provider) {
      case 'openai': setOpenaiModel(model); break
      case 'anthropic': setAnthropicModel(model); break
      case 'google': setGoogleModel(model); break
    }
  }

  const validateApiKey = async () => {
    const apiKey = getCurrentKey()
    if (!apiKey.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setIsValidatingKey(true)
    setKeyValid(prev => ({ ...prev, [provider]: null }))

    try {
      const response = await fetch('/api/ai/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      })

      const data = await response.json()
      setKeyValid(prev => ({ ...prev, [provider]: data.valid }))

      if (data.valid) {
        toast.success('API key is valid!')
      } else {
        toast.error('API key is invalid')
      }
    } catch (error) {
      toast.error('Failed to validate API key')
      setKeyValid(prev => ({ ...prev, [provider]: false }))
    } finally {
      setIsValidatingKey(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // Update profile
      if (profile) {
        await (supabase.from('profiles') as any)
          .update({
            username,
            daily_goal: dailyGoal,
          })
          .eq('id', profile.id)
      }

      // Update or insert AI settings
      const aiSettingsData = {
        user_id: userId,
        default_provider: provider,
        openai_api_key: openaiKey || null,
        openai_model: openaiModel,
        openai_key_valid: keyValid.openai ?? false,
        anthropic_api_key: anthropicKey || null,
        anthropic_model: anthropicModel,
        anthropic_key_valid: keyValid.anthropic ?? false,
        google_api_key: googleKey || null,
        google_model: googleModel,
        google_key_valid: keyValid.google ?? false,
      }

      if (aiSettings) {
        await (supabase.from('user_ai_settings') as any)
          .update(aiSettingsData)
          .eq('id', aiSettings.id)
      } else {
        await (supabase.from('user_ai_settings') as any)
          .insert(aiSettingsData)
      }

      toast.success('Settings saved successfully!')
      router.refresh()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            Learning Goals
          </CardTitle>
          <CardDescription>
            Customize your daily targets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Daily Review Goal</Label>
            <Select
              value={dailyGoal.toString()}
              onValueChange={(v) => setDailyGoal(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select daily goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 reviews</SelectItem>
                <SelectItem value="20">20 reviews</SelectItem>
                <SelectItem value="30">30 reviews</SelectItem>
                <SelectItem value="50">50 reviews</SelectItem>
                <SelectItem value="100">100 reviews</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Number of reviews to complete each day
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber-600" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Configure your AI tutor settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Default AI Provider</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(AI_PROVIDERS).map((p) => (
                <Button
                  key={p.id}
                  variant={provider === p.id ? 'default' : 'outline'}
                  className="h-auto py-3"
                  onClick={() => setProvider(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={getCurrentModel()} onValueChange={setCurrentModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <span>{m.name}</span>
                      <span className="text-xs text-gray-500">{m.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              {currentProvider.name} API Key
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type="password"
                  value={getCurrentKey()}
                  onChange={(e) => {
                    setCurrentKey(e.target.value)
                    setKeyValid(prev => ({ ...prev, [provider]: null }))
                  }}
                  placeholder={`Enter your ${currentProvider.name} API key`}
                />
                {keyValid[provider] !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {keyValid[provider] ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={validateApiKey}
                disabled={isValidatingKey || !getCurrentKey().trim()}
              >
                {isValidatingKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Your API key is stored securely and used only for AI features.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Settings
      </Button>
    </div>
  )
}
