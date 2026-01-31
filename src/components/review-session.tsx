'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Flashcard } from '@/components/flashcard'
import { calculateNextReview, qualityFromRating, calculateXP } from '@/lib/srs'
import type { UserVocabProgress, Vocabulary, Derivative, Mnemonic, ExampleSentence } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface DueProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  dueProgress: DueProgressWithVocab[]
  derivatives: Derivative[]
  mnemonics: Mnemonic[]
  examples: ExampleSentence[]
  userId: string
  reviewRecent?: boolean
}

export function ReviewSession({
  dueProgress,
  derivatives,
  mnemonics,
  examples,
  userId,
  reviewRecent = false,
}: Props) {
  const supabase = createClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentProgress = dueProgress[currentIndex]
  const currentWord = currentProgress?.vocabulary

  // Get helpers for current word
  const wordDerivatives = derivatives.filter(d => d.vocab_id === currentWord?.id)
  const wordMnemonics = mnemonics.filter(m => m.vocab_id === currentWord?.id)
  const wordExamples = examples.filter(e => e.vocab_id === currentWord?.id)

  const handleRating = useCallback(async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentProgress || !currentWord) return

    const quality = qualityFromRating(rating)

    const result = calculateNextReview(quality, {
      easeFactor: currentProgress.ease_factor,
      interval: currentProgress.interval,
      repetitions: currentProgress.repetitions,
    })

    const xpEarned = calculateXP(quality, result.status)
    setSessionXP(prev => prev + xpEarned)

    if (quality >= 3) {
      setCorrectCount(prev => prev + 1)
    }

    // Save progress to database
    await (supabase.from('user_vocab_progress') as any)
      .update({
        status: result.status,
        ease_factor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        next_review: result.nextReview.toISOString(),
        last_review: new Date().toISOString(),
      })
      .eq('id', currentProgress.id)

    // Update XP in profile
    await (supabase as any).rpc('increment_xp', { user_id: userId, amount: xpEarned })

    setIsFlipped(false)

    // Move to next word or complete
    if (currentIndex < dueProgress.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentProgress, currentWord, currentIndex, dueProgress.length, supabase, userId])

  if (isComplete) {
    const accuracy = Math.round((correctCount / dueProgress.length) * 100)

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Review Complete!
              </h2>
              <p className="text-gray-500 mt-2">
                You reviewed {dueProgress.length} words
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">+{sessionXP}</p>
                <p className="text-sm text-gray-500">XP Earned</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link href="/learn">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learn More
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = ((currentIndex + 1) / dueProgress.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-amber-600">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">
            {reviewRecent ? 'Recent Review' : 'Review Session'}
          </span>
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
          <span>{currentIndex + 1} / {dueProgress.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Flashcard */}
      {currentWord && (
        <Flashcard
          word={currentWord}
          derivatives={wordDerivatives}
          mnemonics={wordMnemonics}
          examples={wordExamples}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(true)}
          onRating={handleRating}
        />
      )}
    </div>
  )
}
