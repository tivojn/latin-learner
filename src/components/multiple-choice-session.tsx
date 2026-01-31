'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { calculateNextReview, calculateXP, type Quality } from '@/lib/srs'
import type { UserVocabProgress, Vocabulary } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  practiceWords: ProgressWithVocab[]
  allVocab: Vocabulary[]
  userId: string
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function MultipleChoiceSession({
  practiceWords,
  allVocab,
  userId,
}: Props) {
  const supabase = createClient()

  // Shuffle words for variety
  const shuffledWords = useMemo(() => shuffleArray(practiceWords), [practiceWords])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentProgress = shuffledWords[currentIndex]
  const currentWord = currentProgress?.vocabulary

  // Generate answer options
  const options = useMemo(() => {
    if (!currentWord) return []

    // Get 3 wrong answers from other vocab
    const wrongOptions = allVocab
      .filter(v => v.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.english)

    // Combine with correct answer and shuffle
    return shuffleArray([currentWord.english, ...wrongOptions])
  }, [currentWord, allVocab])

  const handleAnswer = useCallback(async (answer: string) => {
    if (isAnswered || !currentWord || !currentProgress) return

    setSelectedAnswer(answer)
    setIsAnswered(true)

    const isCorrect = answer === currentWord.english
    const quality: Quality = isCorrect ? 4 : 1

    if (isCorrect) {
      setCorrectCount(prev => prev + 1)
    }

    const result = calculateNextReview(quality, {
      easeFactor: currentProgress.ease_factor,
      interval: currentProgress.interval,
      repetitions: currentProgress.repetitions,
    })

    const xpEarned = calculateXP(quality, result.status)
    setSessionXP(prev => prev + xpEarned)

    // Save progress
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

    // Update XP
    await (supabase as any).rpc('increment_xp', { user_id: userId, amount: xpEarned })
  }, [isAnswered, currentWord, currentProgress, supabase, userId])

  const handleNext = useCallback(() => {
    setSelectedAnswer(null)
    setIsAnswered(false)

    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, shuffledWords.length])

  if (isComplete) {
    const accuracy = Math.round((correctCount / shuffledWords.length) * 100)

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Session Complete!
              </h2>
              <p className="text-gray-500 mt-2">
                You practiced {shuffledWords.length} words
              </p>
            </div>

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
                <Link href="/modes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Practice Modes
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>
                Play Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = ((currentIndex + 1) / shuffledWords.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/modes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="text-sm font-medium text-orange-600">
          Multiple Choice
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{sessionXP} XP</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Progress</span>
          <span>{currentIndex + 1} / {shuffledWords.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-gray-500 mb-2">What is the English meaning of:</p>
          <p className="text-3xl font-bold text-amber-800 dark:text-amber-400">
            {currentWord?.latin}
          </p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map((option, index) => {
          const isCorrect = option === currentWord?.english
          const isSelected = selectedAnswer === option

          let buttonClass = 'w-full py-4 h-auto text-left justify-start text-base'

          if (isAnswered) {
            if (isCorrect) {
              buttonClass += ' bg-green-100 border-green-500 text-green-800 hover:bg-green-100'
            } else if (isSelected && !isCorrect) {
              buttonClass += ' bg-red-100 border-red-500 text-red-800 hover:bg-red-100'
            }
          }

          return (
            <Button
              key={index}
              variant="outline"
              className={buttonClass}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
            >
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                )}
              </span>
            </Button>
          )
        })}
      </div>

      {/* Next button */}
      {isAnswered && (
        <Button className="w-full" onClick={handleNext}>
          {currentIndex < shuffledWords.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  )
}
