import { createClient } from '@/lib/supabase/server'
import { ReviewSession } from '@/components/review-session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, BookOpen, Clock } from 'lucide-react'
import type { UserVocabProgress, Vocabulary, Derivative, Mnemonic, ExampleSentence } from '@/types/database'

interface DueProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

interface Props {
  searchParams: Promise<{ mode?: string }>
}

export default async function ReviewPage({ searchParams }: Props) {
  const { mode } = await searchParams
  const reviewRecent = mode === 'recent'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dueProgress: DueProgressWithVocab[] | null = null

  if (reviewRecent) {
    // Get words reviewed in the last 24 hours (recently learned)
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const { data } = await supabase
      .from('user_vocab_progress')
      .select(`
        *,
        vocabulary:vocab_id (*)
      `)
      .eq('user_id', user!.id)
      .gte('last_review', oneDayAgo.toISOString())
      .order('last_review', { ascending: false })
      .limit(50) as { data: DueProgressWithVocab[] | null }

    dueProgress = data
  } else {
    // Get vocabulary due for review (normal mode)
    const { data } = await supabase
      .from('user_vocab_progress')
      .select(`
        *,
        vocabulary:vocab_id (*)
      `)
      .eq('user_id', user!.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review')
      .limit(50) as { data: DueProgressWithVocab[] | null }

    dueProgress = data
  }

  if (!dueProgress || dueProgress.length === 0) {
    // Check if there are recently learned words (for showing the option)
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const { count: recentCount } = await supabase
      .from('user_vocab_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('last_review', oneDayAgo.toISOString())

    const hasRecentWords = (recentCount || 0) > 0

    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reviewRecent ? 'No recent words!' : 'All caught up!'}
              </h2>
              <p className="text-gray-500 mt-2">
                {reviewRecent
                  ? 'You haven\'t learned any words in the last 24 hours.'
                  : 'No reviews due right now. Great work!'
                }
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {!reviewRecent && hasRecentWords && (
                <Button asChild variant="default">
                  <Link href="/review?mode=recent">
                    <Clock className="h-4 w-4 mr-2" />
                    Review Recently Learned
                  </Link>
                </Button>
              )}
              <Button asChild variant={!reviewRecent && hasRecentWords ? 'outline' : 'default'}>
                <Link href="/learn">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Learn New Words
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get vocabulary IDs for fetching helpers
  const vocabIds = dueProgress.map(p => p.vocab_id)

  // Get derivatives
  const { data: derivatives } = await supabase
    .from('derivatives')
    .select('*')
    .in('vocab_id', vocabIds) as { data: Derivative[] | null }

  // Get mnemonics
  const { data: mnemonics } = await supabase
    .from('mnemonics')
    .select('*')
    .in('vocab_id', vocabIds) as { data: Mnemonic[] | null }

  // Get example sentences
  const { data: examples } = await supabase
    .from('example_sentences')
    .select('*')
    .in('vocab_id', vocabIds) as { data: ExampleSentence[] | null }

  return (
    <ReviewSession
      dueProgress={dueProgress}
      derivatives={derivatives || []}
      mnemonics={mnemonics || []}
      examples={examples || []}
      userId={user!.id}
      reviewRecent={reviewRecent}
    />
  )
}
