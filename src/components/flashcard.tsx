'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Vocabulary, Derivative, Mnemonic, ExampleSentence } from '@/types/database'
import { RotateCcw, ChevronRight, Lightbulb, BookOpen, Languages } from 'lucide-react'

interface Props {
  word: Vocabulary
  derivatives: Derivative[]
  mnemonics: Mnemonic[]
  examples: ExampleSentence[]
  isFlipped: boolean
  onFlip: () => void
  onRating: (rating: 'again' | 'hard' | 'good' | 'easy') => void
}

export function Flashcard({
  word,
  derivatives,
  mnemonics,
  examples,
  isFlipped,
  onFlip,
  onRating,
}: Props) {
  if (!isFlipped) {
    // Front of card - Latin word
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow min-h-[300px] flex items-center justify-center"
        onClick={onFlip}
      >
        <CardContent className="text-center py-12 px-8">
          <p className="text-4xl font-bold text-amber-800 dark:text-amber-400 mb-4">
            {word.latin}
          </p>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Tap to reveal
          </p>
        </CardContent>
      </Card>
    )
  }

  // Back of card - English translation + helpers
  return (
    <div className="space-y-4">
      <Card className="min-h-[300px]">
        <CardContent className="py-8 px-6 space-y-6">
          {/* Latin word */}
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-800 dark:text-amber-400">
              {word.latin}
            </p>
          </div>

          {/* English translation */}
          <div className="text-center border-t border-b py-6">
            <p className="text-xl text-gray-800 dark:text-gray-200">
              {word.english}
            </p>
          </div>

          {/* Derivatives */}
          {derivatives.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Languages className="h-4 w-4" />
                English Derivatives
              </div>
              <div className="flex flex-wrap gap-2">
                {derivatives.map(d => (
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

          {/* Mnemonics */}
          {mnemonics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <Lightbulb className="h-4 w-4" />
                Memory Tips
              </div>
              {mnemonics.map(m => (
                <div
                  key={m.id}
                  className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm"
                >
                  {m.tip}
                </div>
              ))}
            </div>
          )}

          {/* Example sentences */}
          {examples.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                <BookOpen className="h-4 w-4" />
                Example Sentences
              </div>
              {examples.slice(0, 2).map(e => (
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
        </CardContent>
      </Card>

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="flex-col py-4 h-auto border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={() => onRating('again')}
        >
          <span className="text-red-600 font-semibold">Again</span>
          <span className="text-xs text-gray-500 mt-1">&lt;1min</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col py-4 h-auto border-orange-200 hover:bg-orange-50 hover:border-orange-300"
          onClick={() => onRating('hard')}
        >
          <span className="text-orange-600 font-semibold">Hard</span>
          <span className="text-xs text-gray-500 mt-1">10min</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col py-4 h-auto border-green-200 hover:bg-green-50 hover:border-green-300"
          onClick={() => onRating('good')}
        >
          <span className="text-green-600 font-semibold">Good</span>
          <span className="text-xs text-gray-500 mt-1">1 day</span>
        </Button>
        <Button
          variant="outline"
          className="flex-col py-4 h-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          onClick={() => onRating('easy')}
        >
          <span className="text-blue-600 font-semibold">Easy</span>
          <span className="text-xs text-gray-500 mt-1">4 days</span>
        </Button>
      </div>
    </div>
  )
}
