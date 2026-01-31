'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserVocabProgress, Vocabulary } from '@/types/database'
import {
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Grid3X3,
} from 'lucide-react'
import Link from 'next/link'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  practiceWords: ProgressWithVocab[]
  userId: string
}

interface MatchCard {
  id: string
  text: string
  vocabId: number
  type: 'latin' | 'english'
  isMatched: boolean
  isSelected: boolean
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function MatchingSession({ practiceWords, userId }: Props) {
  const supabase = createClient()

  // Take 6 words for matching
  const gameWords = useMemo(() =>
    shuffleArray(practiceWords).slice(0, Math.min(6, practiceWords.length)),
    [practiceWords]
  )

  // Create cards
  const initialCards = useMemo(() => {
    const cards: MatchCard[] = []

    gameWords.forEach((p, index) => {
      cards.push({
        id: `latin-${index}`,
        text: p.vocabulary.latin,
        vocabId: p.vocabulary.id,
        type: 'latin',
        isMatched: false,
        isSelected: false,
      })
      cards.push({
        id: `english-${index}`,
        text: p.vocabulary.english,
        vocabId: p.vocabulary.id,
        type: 'english',
        isMatched: false,
        isSelected: false,
      })
    })

    return shuffleArray(cards)
  }, [gameWords])

  const [cards, setCards] = useState(initialCards)
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null)
  const [matchCount, setMatchCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer
  useEffect(() => {
    if (isComplete) return

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, isComplete])

  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || card.isSelected) return

    if (!selectedCard) {
      // First card selected
      setSelectedCard(card)
      setCards(prev => prev.map(c =>
        c.id === card.id ? { ...c, isSelected: true } : c
      ))
    } else {
      // Second card selected
      if (selectedCard.vocabId === card.vocabId && selectedCard.type !== card.type) {
        // Match!
        setCards(prev => prev.map(c =>
          c.vocabId === card.vocabId
            ? { ...c, isMatched: true, isSelected: false }
            : c
        ))
        setMatchCount(prev => prev + 1)

        const xpEarned = 15
        setSessionXP(prev => prev + xpEarned)

        // Update XP
        ;(supabase as any).rpc('increment_xp', { user_id: userId, amount: xpEarned })

        // Check if complete
        if (matchCount + 1 === gameWords.length) {
          setIsComplete(true)
        }
      } else {
        // No match
        setWrongCount(prev => prev + 1)

        // Reset selection after a short delay
        setCards(prev => prev.map(c =>
          c.id === card.id ? { ...c, isSelected: true } : c
        ))

        setTimeout(() => {
          setCards(prev => prev.map(c => ({ ...c, isSelected: false })))
        }, 500)
      }

      setSelectedCard(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isComplete) {
    const accuracy = matchCount + wrongCount > 0
      ? Math.round((matchCount / (matchCount + wrongCount)) * 100)
      : 100

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                All Matched!
              </h2>
              <p className="text-gray-500 mt-2">
                You matched {matchCount} pairs in {formatTime(elapsedTime)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{accuracy}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</p>
                <p className="text-sm text-gray-500">Time</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">+{sessionXP}</p>
                <p className="text-sm text-gray-500">XP</p>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-teal-600">
            <Grid3X3 className="h-4 w-4" />
            <span className="text-sm font-medium">Matching</span>
          </div>
          <span className="text-sm text-gray-500">{formatTime(elapsedTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-amber-600">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">{sessionXP} XP</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 text-sm">
        <span className="text-green-600">Matches: {matchCount}/{gameWords.length}</span>
        <span className="text-red-600">Mistakes: {wrongCount}</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            disabled={card.isMatched}
            className={`
              p-4 rounded-lg text-sm font-medium transition-all duration-200
              min-h-[80px] flex items-center justify-center text-center
              ${card.isMatched
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 cursor-default'
                : card.isSelected
                  ? 'bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400'
                  : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }
              ${card.type === 'latin'
                ? 'italic text-amber-800 dark:text-amber-400'
                : 'text-gray-700 dark:text-gray-300'
              }
            `}
          >
            {card.text}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        Match each Latin word with its English meaning
      </p>
    </div>
  )
}
