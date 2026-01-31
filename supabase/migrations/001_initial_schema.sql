-- IGCSE Latin Learner - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  xp_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_freeze_count INTEGER DEFAULT 3,
  last_study_date DATE,
  daily_goal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- USER VOCABULARY PROGRESS (SRS)
-- ============================================
CREATE TABLE IF NOT EXISTS user_vocab_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vocab_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
  ease_factor REAL DEFAULT 2.5,
  interval INTEGER DEFAULT 0, -- days
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT now(),
  last_review TIMESTAMPTZ,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocab_id)
);

-- ============================================
-- DERIVATIVES (English words from Latin)
-- ============================================
CREATE TABLE IF NOT EXISTS derivatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vocab_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
  english_word TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXAMPLE SENTENCES (CLC-style)
-- ============================================
CREATE TABLE IF NOT EXISTS example_sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vocab_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
  latin_sentence TEXT NOT NULL,
  english_translation TEXT NOT NULL,
  clc_book INTEGER, -- Cambridge Latin Course book number
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MNEMONICS (Memory tips)
-- ============================================
CREATE TABLE IF NOT EXISTS mnemonics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vocab_id BIGINT REFERENCES vocabulary(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = default/system
  tip TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STUDY SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('flashcard', 'fanfold', 'cloze', 'multiple_choice', 'typing', 'matching')),
  list_number INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  words_reviewed INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0
);

-- ============================================
-- BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- USER BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- USER AI SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Provider selection
  default_provider TEXT DEFAULT 'anthropic' CHECK (default_provider IN ('openai', 'anthropic', 'google')),

  -- OpenAI settings
  openai_api_key TEXT,
  openai_model TEXT DEFAULT 'gpt-5.2',
  openai_key_valid BOOLEAN DEFAULT false,
  openai_key_validated_at TIMESTAMPTZ,
  openai_available_models JSONB DEFAULT '[]',
  openai_models_refreshed_at TIMESTAMPTZ,

  -- Anthropic settings
  anthropic_api_key TEXT,
  anthropic_model TEXT DEFAULT 'claude-sonnet-4-5-20241022',
  anthropic_key_valid BOOLEAN DEFAULT false,
  anthropic_key_validated_at TIMESTAMPTZ,
  anthropic_available_models JSONB DEFAULT '[]',
  anthropic_models_refreshed_at TIMESTAMPTZ,

  -- Google settings
  google_api_key TEXT,
  google_model TEXT DEFAULT 'gemini-3-flash',
  google_key_valid BOOLEAN DEFAULT false,
  google_key_validated_at TIMESTAMPTZ,
  google_available_models JSONB DEFAULT '[]',
  google_models_refreshed_at TIMESTAMPTZ,

  -- Feature toggles
  ai_mnemonics_enabled BOOLEAN DEFAULT true,
  ai_sentences_enabled BOOLEAN DEFAULT true,
  ai_chat_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AI CHAT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_used TEXT NOT NULL CHECK (provider_used IN ('openai', 'anthropic', 'google')),
  model_used TEXT NOT NULL,
  messages JSONB NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (username IS NOT NULL);

-- User Vocab Progress
ALTER TABLE user_vocab_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress" ON user_vocab_progress
  FOR ALL USING (auth.uid() = user_id);

-- Derivatives (public read)
ALTER TABLE derivatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read derivatives" ON derivatives
  FOR SELECT USING (true);

-- Example Sentences (public read)
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read example sentences" ON example_sentences
  FOR SELECT USING (true);

-- Mnemonics
ALTER TABLE mnemonics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read mnemonics" ON mnemonics
  FOR SELECT USING (true);

CREATE POLICY "Users can create mnemonics" ON mnemonics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mnemonics" ON mnemonics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mnemonics" ON mnemonics
  FOR DELETE USING (auth.uid() = user_id);

-- Study Sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Badges (public read)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges" ON badges
  FOR SELECT USING (true);

-- User Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public badge display" ON user_badges
  FOR SELECT USING (true);

-- User AI Settings
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI settings" ON user_ai_settings
  FOR ALL USING (auth.uid() = user_id);

-- AI Chat History
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat history" ON ai_chat_history
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_ai_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_vocab_progress_updated_at
  BEFORE UPDATE ON user_vocab_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_ai_settings_updated_at
  BEFORE UPDATE ON user_ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user ON user_vocab_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_next_review ON user_vocab_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_status ON user_vocab_progress(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_mnemonics_vocab ON mnemonics(vocab_id);
CREATE INDEX IF NOT EXISTS idx_derivatives_vocab ON derivatives(vocab_id);
CREATE INDEX IF NOT EXISTS idx_example_sentences_vocab ON example_sentences(vocab_id);

-- ============================================
-- SEED BADGES
-- ============================================

INSERT INTO badges (name, description, icon, criteria) VALUES
  ('First Steps', 'Complete your first study session', 'baby', '{"sessions": 1}'),
  ('Week Warrior', 'Maintain a 7-day streak', 'flame', '{"streak": 7}'),
  ('Month Master', 'Maintain a 30-day streak', 'crown', '{"streak": 30}'),
  ('Century Club', 'Learn 100 words', 'star', '{"words_mastered": 100}'),
  ('Vocabulary Victor', 'Master all words in a list', 'trophy', '{"list_complete": true}'),
  ('Perfect Session', 'Get 100% in a study session (10+ words)', 'target', '{"perfect_session": true}'),
  ('Night Owl', 'Study after midnight', 'moon', '{"night_study": true}'),
  ('Early Bird', 'Study before 6am', 'sun', '{"early_study": true}'),
  ('Speed Demon', 'Complete 50 reviews in under 5 minutes', 'zap', '{"speed_review": true}'),
  ('Helpful Hand', 'Share a mnemonic that gets 10 upvotes', 'heart', '{"mnemonic_upvotes": 10}')
ON CONFLICT (name) DO NOTHING;

-- Done!
SELECT 'Schema created successfully!' as status;
