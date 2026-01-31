// Spaced Repetition System based on SM-2 algorithm
// Implements Ebbinghaus forgetting curve principles

export type SRSStatus = 'new' | 'learning' | 'review' | 'mastered'

export interface SRSResult {
  easeFactor: number
  interval: number
  repetitions: number
  nextReview: Date
  status: SRSStatus
}

export interface SRSParams {
  easeFactor: number
  interval: number
  repetitions: number
}

// Quality ratings (0-5 scale)
// 0-2: Failed (incorrect response)
// 3: Correct with difficulty
// 4: Correct with hesitation
// 5: Perfect recall
export type Quality = 0 | 1 | 2 | 3 | 4 | 5

const MIN_EASE_FACTOR = 1.3
const INITIAL_EASE_FACTOR = 2.5

// Learning steps in minutes
const LEARNING_STEPS = [1, 10, 60, 1440] // 1min, 10min, 1hr, 1day

export function calculateNextReview(
  quality: Quality,
  params: SRSParams = { easeFactor: INITIAL_EASE_FACTOR, interval: 0, repetitions: 0 }
): SRSResult {
  let { easeFactor, interval, repetitions } = params

  // Failed response - reset to learning
  if (quality < 3) {
    return {
      easeFactor: Math.max(MIN_EASE_FACTOR, easeFactor - 0.2),
      interval: 0,
      repetitions: 0,
      nextReview: new Date(Date.now() + LEARNING_STEPS[0] * 60 * 1000),
      status: 'learning',
    }
  }

  // Successful response - update ease factor
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // Calculate next interval
  if (repetitions === 0) {
    interval = 1 // 1 day
  } else if (repetitions === 1) {
    interval = 6 // 6 days
  } else {
    interval = Math.round(interval * easeFactor)
  }

  repetitions++

  // Determine status based on interval
  let status: SRSStatus
  if (interval < 1) {
    status = 'learning'
  } else if (interval < 7) {
    status = 'learning'
  } else if (interval < 21) {
    status = 'review'
  } else {
    status = 'mastered'
  }

  // Calculate next review date
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
    status,
  }
}

// Simple quality assessment based on user's self-rating
export function qualityFromRating(rating: 'again' | 'hard' | 'good' | 'easy'): Quality {
  switch (rating) {
    case 'again':
      return 1
    case 'hard':
      return 3
    case 'good':
      return 4
    case 'easy':
      return 5
  }
}

// Get interval description for display
export function getIntervalText(days: number): string {
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60)
    if (minutes < 60) return `${minutes}m`
    return `${Math.round(minutes / 60)}h`
  }
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) {
    const weeks = Math.round(days / 7)
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }
  const months = Math.round(days / 30)
  return months === 1 ? '1 month' : `${months} months`
}

// Calculate XP earned based on quality
export function calculateXP(quality: Quality, status: SRSStatus): number {
  const baseXP = quality >= 3 ? 10 : 0
  const bonusXP = quality === 5 ? 5 : quality === 4 ? 2 : 0
  const masteryBonus = status === 'mastered' ? 10 : 0
  return baseXP + bonusXP + masteryBonus
}
