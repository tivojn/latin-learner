-- RPC Functions for Latin Learner

-- Increment XP for a user
CREATE OR REPLACE FUNCTION increment_xp(user_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    xp_points = xp_points + amount,
    updated_at = now()
  WHERE profiles.user_id = increment_xp.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update streak for a user
CREATE OR REPLACE FUNCTION update_streak(user_id UUID)
RETURNS void AS $$
DECLARE
  last_date DATE;
  current_streak INTEGER;
  longest_streak INTEGER;
BEGIN
  SELECT
    p.last_study_date,
    p.current_streak,
    p.longest_streak
  INTO last_date, current_streak, longest_streak
  FROM profiles p
  WHERE p.user_id = update_streak.user_id;

  -- If studied today, do nothing
  IF last_date = CURRENT_DATE THEN
    RETURN;
  END IF;

  -- If studied yesterday, increment streak
  IF last_date = CURRENT_DATE - 1 THEN
    current_streak := current_streak + 1;
    IF current_streak > longest_streak THEN
      longest_streak := current_streak;
    END IF;
  -- If missed a day, reset streak
  ELSIF last_date < CURRENT_DATE - 1 OR last_date IS NULL THEN
    current_streak := 1;
  END IF;

  UPDATE profiles
  SET
    current_streak = current_streak,
    longest_streak = longest_streak,
    last_study_date = CURRENT_DATE,
    updated_at = now()
  WHERE profiles.user_id = update_streak.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
  user_profile RECORD;
  badge_record RECORD;
  session_count INTEGER;
  words_mastered INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE user_id = p_user_id;

  -- Count study sessions
  SELECT COUNT(*) INTO session_count
  FROM study_sessions
  WHERE user_id = p_user_id;

  -- Count mastered words
  SELECT COUNT(*) INTO words_mastered
  FROM user_vocab_progress
  WHERE user_id = p_user_id AND status = 'mastered';

  -- Check each badge
  FOR badge_record IN SELECT * FROM badges LOOP
    -- Skip if already earned
    IF EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = p_user_id AND badge_id = badge_record.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check criteria
    IF badge_record.criteria->>'sessions' IS NOT NULL
       AND session_count >= (badge_record.criteria->>'sessions')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, badge_record.id);
    END IF;

    IF badge_record.criteria->>'streak' IS NOT NULL
       AND user_profile.current_streak >= (badge_record.criteria->>'streak')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, badge_record.id);
    END IF;

    IF badge_record.criteria->>'words_mastered' IS NOT NULL
       AND words_mastered >= (badge_record.criteria->>'words_mastered')::INTEGER THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (p_user_id, badge_record.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_xp TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges TO authenticated;
