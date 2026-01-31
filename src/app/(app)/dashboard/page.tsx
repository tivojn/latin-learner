import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {
  BookOpen,
  RefreshCw,
  Target,
  TrendingUp,
  Calendar,
  Zap,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single() as { data: { daily_goal: number } | null }

  // Get vocabulary stats
  const { count: totalVocab } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact', head: true })

  // Get user progress stats
  const { data: progressStats } = await supabase
    .from('user_vocab_progress')
    .select('status')
    .eq('user_id', user!.id) as { data: Array<{ status: string }> | null }

  const stats = {
    total: totalVocab || 0,
    new: 0,
    learning: 0,
    review: 0,
    mastered: 0,
  }

  progressStats?.forEach((p) => {
    if (p.status in stats) {
      stats[p.status as keyof typeof stats]++
    }
  })

  stats.new = stats.total - stats.learning - stats.review - stats.mastered

  // Get due reviews count
  const { count: dueReviews } = await supabase
    .from('user_vocab_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .lte('next_review', new Date().toISOString())

  // Get lists
  const { data: lists } = await supabase
    .from('vocabulary')
    .select('list')
    .order('list') as { data: Array<{ list: number }> | null }

  const uniqueLists = [...new Set(lists?.map(l => l.list) || [])]

  const masteredPercent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
          Salve! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Ready to learn some Latin today?
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5" />
              Due for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{dueReviews || 0}</p>
            <p className="text-amber-100 text-sm mt-1">words waiting</p>
            <Button asChild className="mt-4 bg-white text-amber-700 hover:bg-amber-50">
              <Link href="/review">Start Review</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
              Learn New Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-700">{stats.new}</p>
            <p className="text-gray-500 text-sm mt-1">words to discover</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/learn">Start Learning</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-green-600" />
              Daily Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-700">
              0/{profile?.daily_goal || 20}
            </p>
            <p className="text-gray-500 text-sm mt-1">reviews today</p>
            <Progress value={0} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      {/* Progress overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Your Progress
          </CardTitle>
          <CardDescription>
            {masteredPercent}% of vocabulary mastered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={masteredPercent} className="h-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-600">{stats.new}</p>
                <p className="text-xs text-gray-500">New</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-600">{stats.learning}</p>
                <p className="text-xs text-blue-600">Learning</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-amber-600">{stats.review}</p>
                <p className="text-xs text-amber-600">Review</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{stats.mastered}</p>
                <p className="text-xs text-green-600">Mastered</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Vocabulary Lists
          </CardTitle>
          <CardDescription>
            Choose a list to study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {uniqueLists.map((list) => (
              <Link
                key={list}
                href={`/learn/${list}`}
                className="flex flex-col items-center justify-center p-4 rounded-lg border border-amber-200 hover:border-amber-400 hover:bg-amber-50 dark:border-zinc-700 dark:hover:border-amber-600 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {list}
                </span>
                <span className="text-xs text-gray-500 mt-1">List</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Practice modes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            Practice Modes
          </CardTitle>
          <CardDescription>
            Different ways to test your knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: 'Flashcards', href: '/modes/flashcards', desc: 'Classic flip cards' },
              { name: 'Fanfold', href: '/modes/fanfold', desc: 'Progressive reveal' },
              { name: 'Cloze', href: '/modes/cloze', desc: 'Fill in the blank' },
              { name: 'Multiple Choice', href: '/modes/multiple-choice', desc: 'Pick the answer' },
              { name: 'Typing', href: '/modes/typing', desc: 'Type the translation' },
              { name: 'Matching', href: '/modes/matching', desc: 'Match pairs' },
            ].map((mode) => (
              <Link
                key={mode.name}
                href={mode.href}
                className="p-4 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50 dark:border-zinc-700 dark:hover:border-amber-600 dark:hover:bg-zinc-800 transition-colors"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-200">{mode.name}</p>
                <p className="text-xs text-gray-500 mt-1">{mode.desc}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
