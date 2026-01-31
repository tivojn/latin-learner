import { createClient } from '@/lib/supabase/server'
import { TypingSession } from '@/components/typing-session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, AlertCircle } from 'lucide-react'
import type { UserVocabProgress, Vocabulary } from '@/types/database'

interface ProgressWithVocab extends UserVocabProgress {
  vocabulary: Vocabulary
}

export default async function TypingModePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get vocabulary with progress
  const { data: progressVocab } = await supabase
    .from('user_vocab_progress')
    .select(`
      *,
      vocabulary:vocab_id (*)
    `)
    .eq('user_id', user!.id)
    .in('status', ['learning', 'review', 'mastered'])
    .limit(20) as { data: ProgressWithVocab[] | null }

  if (!progressVocab || progressVocab.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pb-20 lg:pb-8">
        <Card className="text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-amber-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Learn Some Words First
              </h2>
              <p className="text-gray-500 mt-2">
                Start learning vocabulary before using Typing mode.
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

  return <TypingSession practiceWords={progressVocab} userId={user!.id} />
}
