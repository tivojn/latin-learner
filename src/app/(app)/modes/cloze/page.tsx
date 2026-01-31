import { createClient } from '@/lib/supabase/server'
import { ClozeSession } from '@/components/cloze-session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, AlertCircle } from 'lucide-react'
import type { UserVocabProgress, Vocabulary, ExampleSentence } from '@/types/database'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

export default async function ClozeModePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get vocabulary with progress that has example sentences
  const { data: progressVocab } = await supabase
    .from('user_vocab_progress')
    .select(`
      *,
      vocabulary:vocab_id (*)
    `)
    .eq('user_id', user!.id)
    .in('status', ['learning', 'review', 'mastered'])
    .limit(30) as { data: ProgressWithVocab[] | null }

  // Get example sentences for these words
  const vocabIds = progressVocab?.map(p => p.vocab_id) || []
  const { data: examples } = await supabase
    .from('example_sentences')
    .select('*')
    .in('vocab_id', vocabIds) as { data: ExampleSentence[] | null }

  // Filter to only words that have example sentences
  const wordsWithExamples = progressVocab?.filter(p =>
    examples?.some(e => e.vocab_id === p.vocab_id)
  ) || []

  if (wordsWithExamples.length < 3) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                More Example Sentences Needed
              </h2>
              <p className="text-gray-500 mt-2">
                Cloze mode requires words with example sentences. Learn more words
                or add example sentences to use this mode.
              </p>
            </div>

            <Button asChild>
              <Link href="/learn">
                <BookOpen className="h-4 w-4 mr-2" />
                Start Learning
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ClozeSession
      practiceWords={wordsWithExamples}
      examples={examples || []}
      userId={user!.id}
    />
  )
}
