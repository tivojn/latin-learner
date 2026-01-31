'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { calculateNextReview, calculateXP, type Quality } from '@/lib/srs'
import type { UserVocabProgress, Vocabulary } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  Keyboard,
} from 'lucide-react'
import Link from 'next/link'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  practiceWords: ProgressWithVocab[]
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

function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?'"()]/g, '')
    .replace(/\s+/g, ' ')
}

export function TypingSession({ practiceWords, userId }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const shuffledWords = useMemo(() => shuffleArray(practiceWords), [practiceWords])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentProgress = shuffledWords[currentIndex]
  const currentWord = currentProgress?.vocabulary

  useEffect(() => {
    if (!isAnswered) {
      inputRef.current?.focus()
    }
  }, [currentIndex, isAnswered])

  const checkAnswer = useCallback(async () => {
    if (isAnswered || !currentWord || !currentProgress) return

    const normalizedInput = normalizeAnswer(userInput)
    const normalizedAnswer = normalizeAnswer(currentWord.english)

    // Check if answer matches (allow partial match for long answers)
    const correct = normalizedInput === normalizedAnswer ||
      normalizedAnswer.includes(normalizedInput) && normalizedInput.length >= normalizedAnswer.length * 0.7

    setIsCorrect(correct)
    setIsAnswered(true)

    const quality: Quality = correct ? 4 : 1

    if (correct) {
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
  }, [isAnswered, userInput, currentWord, currentProgress, supabase, userId])

  const handleNext = useCallback(() => {
    setUserInput('')
    setIsAnswered(false)
    setIsCorrect(false)

    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, shuffledWords.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isAnswered) {
        checkAnswer()
      } else {
        handleNext()
      }
    }
  }

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
        <div className="flex items-center gap-2 text-red-600">
          <Keyboard className="h-4 w-4" />
          <span className="text-sm font-medium">Typing Mode</span>
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
          <p className="text-sm text-gray-500 mb-2">Type the English meaning of:</p>
          <p className="text-4xl font-bold text-amber-800 dark:text-amber-400">
            {currentWord?.latin}
          </p>
        </CardContent>
      </Card>

      {/* Input */}
      <div className="space-y-4">
        <Input
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          className={`text-lg py-6 ${
            isAnswered
              ? isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : ''
          }`}
          disabled={isAnswered}
        />

        {isAnswered && (
          <div className={`flex items-center gap-2 p-4 rounded-lg ${
            isCorrect
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            {isCorrect ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <div>
              <p className="font-medium">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {!isCorrect && (
                <p className="text-sm mt-1">
                  The answer was: <strong>{currentWord?.english}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {!isAnswered ? (
          <Button
            className="w-full"
            onClick={checkAnswer}
            disabled={!userInput.trim()}
          >
            Check Answer
          </Button>
        ) : (
          <Button className="w-full" onClick={handleNext}>
            {currentIndex < shuffledWords.length - 1 ? 'Next Word' : 'See Results'}
          </Button>
        )}
      </div>
    </div>
  )
}
