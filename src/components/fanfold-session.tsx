'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { calculateNextReview, qualityFromRating, calculateXP } from '@/lib/srs'
import type { UserVocabProgress, Vocabulary, Derivative, Mnemonic, ExampleSentence } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Layers,
  ChevronDown,
  Languages,
  Lightbulb,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  practiceWords: ProgressWithVocab[]
  derivatives: Derivative[]
  mnemonics: Mnemonic[]
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

type RevealStage = 0 | 1 | 2 | 3 | 4 // 0: latin only, 1: meaning, 2: derivatives, 3: mnemonic, 4: example

export function FanfoldSession({
  practiceWords,
  derivatives,
  mnemonics,
  examples,
  userId,
}: Props) {
  const supabase = createClient()

  const shuffledWords = useMemo(() => shuffleArray(practiceWords), [practiceWords])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [revealStage, setRevealStage] = useState<RevealStage>(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentProgress = shuffledWords[currentIndex]
  const currentWord = currentProgress?.vocabulary

  // Get helpers for current word
  const wordDerivatives = derivatives.filter(d => d.vocab_id === currentWord?.id)
  const wordMnemonics = mnemonics.filter(m => m.vocab_id === currentWord?.id)
  const wordExamples = examples.filter(e => e.vocab_id === currentWord?.id)

  // Determine max reveal stage based on available content
  const maxStage = useMemo(() => {
    let stage = 1 // At minimum, show translation
    if (wordDerivatives.length > 0) stage = 2
    if (wordMnemonics.length > 0) stage = 3
    if (wordExamples.length > 0) stage = 4
    return stage as RevealStage
  }, [wordDerivatives.length, wordMnemonics.length, wordExamples.length])

  const handleReveal = () => {
    if (revealStage < maxStage) {
      setRevealStage((prev) => Math.min(prev + 1, maxStage) as RevealStage)
    }
  }

  const handleRating = useCallback(async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentProgress || !currentWord) return

    const quality = qualityFromRating(rating)

    if (quality >= 3) {
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

    // Move to next word or complete
    setRevealStage(0)
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsComplete(true)
    }
  }, [currentProgress, currentWord, currentIndex, shuffledWords.length, supabase, userId])

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
        <div className="flex items-center gap-2 text-purple-600">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-medium">Fanfold Mode</span>
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

      {/* Fanfold Card */}
      <Card>
        <CardContent className="py-8 space-y-6">
          {/* Latin word - always visible */}
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-800 dark:text-amber-400">
              {currentWord?.latin}
            </p>
          </div>

          {/* Stage 1: Translation */}
          {revealStage >= 1 && (
            <div className="text-center border-t pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-xl text-gray-800 dark:text-gray-200">
                {currentWord?.english}
              </p>
            </div>
          )}

          {/* Stage 2: Derivatives */}
          {revealStage >= 2 && wordDerivatives.length > 0 && (
            <div className="border-t pt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Languages className="h-4 w-4" />
                English Derivatives
              </div>
              <div className="flex flex-wrap gap-2">
                {wordDerivatives.map(d => (
                  <Badge key={d.id} variant="secondary" className="text-sm">
                    {d.english_word}
                    {d.explanation && (
                      <span className="text-gray-500 ml-1">({d.explanation})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stage 3: Mnemonics */}
          {revealStage >= 3 && wordMnemonics.length > 0 && (
            <div className="border-t pt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Lightbulb className="h-4 w-4" />
                Memory Tips
              </div>
              {wordMnemonics.map(m => (
                <div
                  key={m.id}
                  className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm"
                >
                  {m.tip}
                </div>
              ))}
            </div>
          )}

          {/* Stage 4: Example Sentences */}
          {revealStage >= 4 && wordExamples.length > 0 && (
            <div className="border-t pt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <BookOpen className="h-4 w-4" />
                Example Sentences
              </div>
              {wordExamples.slice(0, 2).map(e => (
                <div
                  key={e.id}
                  className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-1"
                >
                  <p className="italic text-amber-700 dark:text-amber-400">
                    {e.latin_sentence}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {e.english_translation}
                  </p>
                  {e.clc_book && (
                    <p className="text-xs text-gray-400">
                      — CLC Book {e.clc_book}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reveal button */}
          {revealStage < maxStage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReveal}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Reveal More
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Rating buttons (only show after revealing translation) */}
      {revealStage >= 1 && (
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="flex-col py-4 h-auto border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={() => handleRating('again')}
          >
            <span className="text-red-600 font-semibold">Again</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col py-4 h-auto border-orange-200 hover:bg-orange-50 hover:border-orange-300"
            onClick={() => handleRating('hard')}
          >
            <span className="text-orange-600 font-semibold">Hard</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col py-4 h-auto border-green-200 hover:bg-green-50 hover:border-green-300"
            onClick={() => handleRating('good')}
          >
            <span className="text-green-600 font-semibold">Good</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col py-4 h-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleRating('easy')}
          >
            <span className="text-blue-600 font-semibold">Easy</span>
          </Button>
        </div>
      )}
    </div>
  )
}
