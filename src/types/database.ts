export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AIProvider = 'openai' | 'anthropic' | 'google'
export type VocabStatus = 'new' | 'learning' | 'review' | 'mastered'
export type StudyMode = 'flashcard' | 'fanfold' | 'cloze' | 'multiple_choice' | 'typing' | 'matching'

export interface Database {
  public: {
    Tables: {
      vocabulary: {
        Row: {
          id: number
          list: number
          latin: string
          english: string
        }
        Insert: {
          id?: number
          list: number
          latin: string
          english: string
        }
        Update: {
          id?: number
          list?: number
          latin?: string
          english?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          avatar_url: string | null
          xp_points: number
          current_streak: number
          longest_streak: number
          streak_freeze_count: number
          last_study_date: string | null
          daily_goal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          avatar_url?: string | null
          xp_points?: number
          current_streak?: number
          longest_streak?: number
          streak_freeze_count?: number
          last_study_date?: string | null
          daily_goal?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          avatar_url?: string | null
          xp_points?: number
          current_streak?: number
          longest_streak?: number
          streak_freeze_count?: number
          last_study_date?: string | null
          daily_goal?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_vocab_progress: {
        Row: {
          id: string
          user_id: string
          vocab_id: number
          ease_factor: number
          interval: number
          repetitions: number
          next_review: string
          last_review: string | null
          status: VocabStatus
          correct_count: number
          incorrect_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vocab_id: number
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          last_review?: string | null
          status?: VocabStatus
          correct_count?: number
          incorrect_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vocab_id?: number
          ease_factor?: number
          interval?: number
          repetitions?: number
          next_review?: string
          last_review?: string | null
          status?: VocabStatus
          correct_count?: number
          incorrect_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      derivatives: {
        Row: {
          id: string
          vocab_id: number
          english_word: string
          explanation: string
          created_at: string
        }
        Insert: {
          id?: string
          vocab_id: number
          english_word: string
          explanation: string
          created_at?: string
        }
        Update: {
          id?: string
          vocab_id?: number
          english_word?: string
          explanation?: string
          created_at?: string
        }
      }
      example_sentences: {
        Row: {
          id: string
          vocab_id: number
          latin_sentence: string
          english_translation: string
          clc_book: number | null
          created_at: string
        }
        Insert: {
          id?: string
          vocab_id: number
          latin_sentence: string
          english_translation: string
          clc_book?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          vocab_id?: number
          latin_sentence?: string
          english_translation?: string
          clc_book?: number | null
          created_at?: string
        }
      }
      mnemonics: {
        Row: {
          id: string
          vocab_id: number
          user_id: string | null
          tip: string
          upvotes: number
          created_at: string
        }
        Insert: {
          id?: string
          vocab_id: number
          user_id?: string | null
          tip: string
          upvotes?: number
          created_at?: string
        }
        Update: {
          id?: string
          vocab_id?: number
          user_id?: string | null
          tip?: string
          upvotes?: number
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          mode: StudyMode
          list_number: number | null
          started_at: string
          ended_at: string | null
          words_reviewed: number
          correct_count: number
          xp_earned: number
        }
        Insert: {
          id?: string
          user_id: string
          mode: StudyMode
          list_number?: number | null
          started_at?: string
          ended_at?: string | null
          words_reviewed?: number
          correct_count?: number
          xp_earned?: number
        }
        Update: {
          id?: string
          user_id?: string
          mode?: StudyMode
          list_number?: number | null
          started_at?: string
          ended_at?: string | null
          words_reviewed?: number
          correct_count?: number
          xp_earned?: number
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          criteria: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          criteria: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          criteria?: Json
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      user_ai_settings: {
        Row: {
          id: string
          user_id: string
          default_provider: AIProvider
          openai_api_key: string | null
          openai_model: string
          openai_key_valid: boolean
          openai_key_validated_at: string | null
          openai_available_models: Json
          openai_models_refreshed_at: string | null
          anthropic_api_key: string | null
          anthropic_model: string
          anthropic_key_valid: boolean
          anthropic_key_validated_at: string | null
          anthropic_available_models: Json
          anthropic_models_refreshed_at: string | null
          google_api_key: string | null
          google_model: string
          google_key_valid: boolean
          google_key_validated_at: string | null
          google_available_models: Json
          google_models_refreshed_at: string | null
          ai_mnemonics_enabled: boolean
          ai_sentences_enabled: boolean
          ai_chat_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_provider?: AIProvider
          openai_api_key?: string | null
          openai_model?: string
          openai_key_valid?: boolean
          openai_key_validated_at?: string | null
          openai_available_models?: Json
          openai_models_refreshed_at?: string | null
          anthropic_api_key?: string | null
          anthropic_model?: string
          anthropic_key_valid?: boolean
          anthropic_key_validated_at?: string | null
          anthropic_available_models?: Json
          anthropic_models_refreshed_at?: string | null
          google_api_key?: string | null
          google_model?: string
          google_key_valid?: boolean
          google_key_validated_at?: string | null
          google_available_models?: Json
          google_models_refreshed_at?: string | null
          ai_mnemonics_enabled?: boolean
          ai_sentences_enabled?: boolean
          ai_chat_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_provider?: AIProvider
          openai_api_key?: string | null
          openai_model?: string
          openai_key_valid?: boolean
          openai_key_validated_at?: string | null
          openai_available_models?: Json
          openai_models_refreshed_at?: string | null
          anthropic_api_key?: string | null
          anthropic_model?: string
          anthropic_key_valid?: boolean
          anthropic_key_validated_at?: string | null
          anthropic_available_models?: Json
          anthropic_models_refreshed_at?: string | null
          google_api_key?: string | null
          google_model?: string
          google_key_valid?: boolean
          google_key_validated_at?: string | null
          google_available_models?: Json
          google_models_refreshed_at?: string | null
          ai_mnemonics_enabled?: boolean
          ai_sentences_enabled?: boolean
          ai_chat_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          user_id: string
          provider_used: AIProvider
          model_used: string
          messages: Json
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_used: AIProvider
          model_used: string
          messages: Json
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_used?: AIProvider
          model_used?: string
          messages?: Json
          tokens_used?: number
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Vocabulary = Database['public']['Tables']['vocabulary']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserVocabProgress = Database['public']['Tables']['user_vocab_progress']['Row']
export type Derivative = Database['public']['Tables']['derivatives']['Row']
export type ExampleSentence = Database['public']['Tables']['example_sentences']['Row']
export type Mnemonic = Database['public']['Tables']['mnemonics']['Row']
export type StudySession = Database['public']['Tables']['study_sessions']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type UserAISettings = Database['public']['Tables']['user_ai_settings']['Row']
export type AIChatHistory = Database['public']['Tables']['ai_chat_history']['Row']
