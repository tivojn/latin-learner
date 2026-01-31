'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { calculateNextReview, calculateXP, type Quality } from '@/lib/srs'
import type { UserVocabProgress, Vocabulary, ExampleSentence } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
} from 'lucide-react'
import Link from 'next/link'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  practiceWords: ProgressWithVocab[]
  examples: ExampleSentence[]
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

export function ClozeSession({ practiceWords, examples, userId }: Props) {
  const supabase = createClient()

  // Create cloze items from words with examples
  const clozeItems = useMemo(() => {
    const items: Array<{
      progress: ProgressWithVocab
      example: ExampleSentence
      clozeSentence: string
      answer: string
    }> = []

    practiceWords.forEach(p => {
      const wordExamples = examples.filter(e => e.vocab_id === p.vocab_id)
      wordExamples.forEach(example => {
        // Create a cloze by replacing the Latin word with blanks
        const word = p.vocabulary.latin.toLowerCase()
        const sentence = example.latin_sentence

        // Find the word in the sentence (case insensitive)
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        if (regex.test(sentence)) {
          const clozeSentence = sentence.replace(regex, '_____')
          items.push({
            progress: p,
            example,
            clozeSentence,
            answer: word,
          })
        }
      })
    })

    return shuffleArray(items).slice(0, 15) // Limit to 15 items
  }, [practiceWords, examples])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isComplete, setIsComplete] = useState(clozeItems.length === 0)

  const currentItem = clozeItems[currentIndex]

  const checkAnswer = useCallback(async () => {
    if (isAnswered || !currentItem) return

    const normalizedInput = userInput.toLowerCase().trim()
    const normalizedAnswer = currentItem.answer.toLowerCase().trim()

    const correct = normalizedInput === normalizedAnswer

    setIsCorrect(correct)
    setIsAnswered(true)

    const quality: Quality = correct ? 4 : 1

    if (correct) {
      setCorrectCount(prev => prev + 1)
    }

    const { progress } = currentItem
    const result = calculateNextReview(quality, {
      easeFactor: progress.ease_factor,
      interval: progress.interval,
      repetitions: progress.repetitions,
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
      .eq('id', progress.id)

    // Update XP
    await (supabase as any).rpc('increment_xp', { user_id: userId, amount: xpEarned })
  }, [isAnswered, userInput, currentItem, supabase, userId])

  const handleNext = useCallback(() => {
    setUserInput('')
    setIsAnswered(false)
    setIsCorrect(false)

    if (currentIndex < clozeItems.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, clozeItems.length])

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
    const accuracy = clozeItems.length > 0
      ? Math.round((correctCount / clozeItems.length) * 100)
      : 0

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
                You completed {clozeItems.length} cloze exercises
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

  const progressPercent = ((currentIndex + 1) / clozeItems.length) * 100

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
        <div className="flex items-center gap-2 text-green-600">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Cloze Mode</span>
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
          <span>{currentIndex + 1} / {clozeItems.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Cloze Card */}
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-gray-500 mb-4">Fill in the missing word:</p>
          <p className="text-2xl leading-relaxed text-gray-800 dark:text-gray-200 italic">
            {currentItem?.clozeSentence}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            ({currentItem?.example.english_translation})
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Hint: {currentItem?.progress.vocabulary.english}
          </p>
        </CardContent>
      </Card>

      {/* Input */}
      <div className="space-y-4">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type the missing Latin word..."
          className={`text-lg py-6 ${
            isAnswered
              ? isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : ''
          }`}
          disabled={isAnswered}
          autoFocus
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
                  The answer was: <strong>{currentItem?.answer}</strong>
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
            {currentIndex < clozeItems.length - 1 ? 'Next' : 'See Results'}
          </Button>
        )}
      </div>
    </div>
  )
}
