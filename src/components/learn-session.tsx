'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/components/flashcard'
import { calculateNextReview, qualityFromRating, calculateXP, type Quality } from '@/lib/srs'
import type { Vocabulary, UserVocabProgress, Derivative, Mnemonic, ExampleSentence } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  listNumber: number
  vocabulary: Vocabulary[]
  progress: UserVocabProgress[]
  derivatives: Derivative[]
  mnemonics: Mnemonic[]
  examples: ExampleSentence[]
  userId: string
  practiceAll?: boolean
}

export function LearnSession({
  listNumber,
  vocabulary,
  progress: initialProgress,
  derivatives,
  mnemonics,
  examples,
  userId,
  practiceAll = false,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Create progress map
  const progressMap = new Map(initialProgress.map(p => [p.vocab_id, p]))

  // Filter words based on mode
  const wordsToStudy = practiceAll
    ? vocabulary  // Practice all: show all words
    : vocabulary.filter(v => {
        const p = progressMap.get(v.id)
        return !p || p.status === 'new'
      })  // Learn mode: only show new words

  // Legacy alias for compatibility
  const newWords = wordsToStudy

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [wordsLearned, setWordsLearned] = useState(0)
  const [isComplete, setIsComplete] = useState(newWords.length === 0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentWord = newWords[currentIndex]

  // Get helpers for current word
  const wordDerivatives = derivatives.filter(d => d.vocab_id === currentWord?.id)
  const wordMnemonics = mnemonics.filter(m => m.vocab_id === currentWord?.id)
  const wordExamples = examples.filter(e => e.vocab_id === currentWord?.id)

  const handleRating = useCallback(async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentWord) return

    const quality = qualityFromRating(rating)
    const existingProgress = progressMap.get(currentWord.id)

    const result = calculateNextReview(quality, existingProgress ? {
      easeFactor: existingProgress.ease_factor,
      interval: existingProgress.interval,
      repetitions: existingProgress.repetitions,
    } : undefined)

    const xpEarned = calculateXP(quality, result.status)
    setSessionXP(prev => prev + xpEarned)

    // Save progress to database
    const progressData = {
      user_id: userId,
      vocab_id: currentWord.id,
      status: result.status,
      ease_factor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      next_review: result.nextReview.toISOString(),
      last_review: new Date().toISOString(),
    }

    if (existingProgress) {
      await (supabase.from('user_vocab_progress') as any)
        .update(progressData)
        .eq('id', existingProgress.id)
    } else {
      await (supabase.from('user_vocab_progress') as any)
        .insert(progressData)
    }

    // Update XP in profile
    await (supabase as any).rpc('increment_xp', { user_id: userId, amount: xpEarned })

    setWordsLearned(prev => prev + 1)
    setIsFlipped(false)

    // Move to next word or complete
    if (currentIndex < newWords.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentWord, currentIndex, newWords.length, progressMap, supabase, userId])

  if (isComplete) {
    const showPracticeAllOption = !practiceAll && newWords.length === 0

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {practiceAll
                  ? 'Practice Complete!'
                  : newWords.length === 0
                    ? 'All caught up!'
                    : 'Session Complete!'
                }
              </h2>
              <p className="text-gray-500 mt-2">
                {practiceAll
                  ? `You practiced ${wordsLearned} words from List ${listNumber}.`
                  : newWords.length === 0
                    ? 'You\'ve learned all words in this list.'
                    : `You learned ${wordsLearned} new words.`
                }
              </p>
            </div>

            {sessionXP > 0 && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <Sparkles className="h-5 w-5" />
                <span className="text-lg font-semibold">+{sessionXP} XP earned!</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/learn">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Lists
                </Link>
              </Button>
              {showPracticeAllOption ? (
                <Button asChild>
                  <Link href={`/learn/${listNumber}?mode=practice`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Practice All Words
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/review?mode=recent">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review What You Learned
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = ((currentIndex + 1) / newWords.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/learn">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="text-sm text-gray-500">
          {practiceAll ? (
            <span className="text-blue-600 font-medium">Practice Mode</span>
          ) : (
            `List ${listNumber}`
          )}
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{sessionXP} XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Progress</span>
          <span>{currentIndex + 1} / {newWords.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Flashcard */}
      <Flashcard
        word={currentWord}
        derivatives={wordDerivatives}
        mnemonics={wordMnemonics}
        examples={wordExamples}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(true)}
        onRating={handleRating}
      />
    </div>
  )
}
