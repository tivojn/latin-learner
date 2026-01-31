import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { BookOpen, CheckCircle, RotateCcw } from 'lucide-react'

export default async function LearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all vocabulary grouped by list
  const { data: vocabulary } = await supabase
    .from('vocabulary')
    .select('id, list')
    .order('list') as { data: Array<{ id: number; list: number }> | null }

  // Get user progress
  const { data: progress } = await supabase
    .from('user_vocab_progress')
    .select('vocab_id, status')
    .eq('user_id', user!.id) as { data: Array<{ vocab_id: number; status: string }> | null }

  // Create a map of vocab_id to status
  const progressMap = new Map(progress?.map(p => [p.vocab_id, p.status]) || [])

  // Group vocabulary by list with progress
  const listStats = new Map<number, { total: number; learned: number; mastered: number }>()

  vocabulary?.forEach(v => {
    const current = listStats.get(v.list) || { total: 0, learned: 0, mastered: 0 }
    current.total++

    const status = progressMap.get(v.id)
    if (status === 'learning' || status === 'review' || status === 'mastered') {
      current.learned++
    }
    if (status === 'mastered') {
      current.mastered++
    }

    listStats.set(v.list, current)
  })

  const lists = Array.from(listStats.entries()).sort((a, b) => a[0] - b[0])

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
          Learn Vocabulary
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Choose a list to study new words
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map(([list, stats]) => {
          const progressPercent = stats.total > 0
            ? Math.round((stats.learned / stats.total) * 100)
            : 0
          const masteredPercent = stats.total > 0
            ? Math.round((stats.mastered / stats.total) * 100)
            : 0
          const newWords = stats.total - stats.learned

          return (
            <Card key={list} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    List {list}
                  </CardTitle>
                  {masteredPercent === 100 && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <CardDescription>
                  {stats.total} words total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">{stats.learned - stats.mastered} learning</span>
                  <span className="text-green-600">{stats.mastered} mastered</span>
                </div>

                {newWords > 0 ? (
                  <Button asChild className="w-full">
                    <Link href={`/learn/${list}`}>
                      Learn {newWords} new words
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/learn/${list}?mode=practice`}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Practice All Words
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {lists.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No vocabulary found</h3>
            <p className="text-gray-500 mt-1">
              Import vocabulary to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
