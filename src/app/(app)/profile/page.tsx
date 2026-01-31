import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import type { Profile, Badge as BadgeType, UserBadge } from '@/types/database'
import {
  User,
  Flame,
  Star,
  Trophy,
  Target,
  Calendar,
  Settings,
} from 'lucide-react'

interface UserBadgeWithBadge extends UserBadge {
  badge: BadgeType
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single() as { data: Profile | null }

  // Get user badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges (*)
    `)
    .eq('user_id', user!.id) as { data: UserBadgeWithBadge[] | null }

  // Get progress stats
  const { data: progressStats } = await supabase
    .from('user_vocab_progress')
    .select('status')
    .eq('user_id', user!.id) as { data: Array<{ status: string }> | null }

  const stats = {
    total: progressStats?.length || 0,
    learning: 0,
    review: 0,
    mastered: 0,
  }

  progressStats?.forEach((p) => {
    if (p.status === 'learning') stats.learning++
    if (p.status === 'review') stats.review++
    if (p.status === 'mastered') stats.mastered++
  })

  // Get total vocabulary count
  const { count: totalVocab } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact', head: true })

  const masteredPercent = (totalVocab || 0) > 0
    ? Math.round((stats.mastered / (totalVocab || 1)) * 100)
    : 0

  return (
    <div className="space-y-8 pb-20 lg:pb-8 max-w-3xl mx-auto">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
              <User className="h-12 w-12 text-amber-800 dark:text-amber-200" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.username || 'Student'}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <Badge className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                  <Flame className="h-3 w-3" />
                  {profile?.current_streak || 0} day streak
                </Badge>
                <Badge className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <Star className="h-3 w-3" />
                  {profile?.xp_points || 0} XP
                </Badge>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/profile/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Words Mastered</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.mastered}</p>
            <Progress value={masteredPercent} className="h-2 mt-2" />
            <p className="text-xs text-gray-500 mt-1">{masteredPercent}% of {totalVocab}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Words Learning</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.learning}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Best Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <p className="text-3xl font-bold text-orange-600">
                {profile?.longest_streak || 0}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily Goal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-green-500" />
              <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {profile?.daily_goal || 20}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">reviews/day</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Achievements
          </CardTitle>
          <CardDescription>
            Badges you've earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userBadges && userBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {userBadges.map((ub: any) => (
                <div
                  key={ub.id}
                  className="flex flex-col items-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20"
                >
                  <span className="text-4xl">{ub.badge.icon}</span>
                  <p className="font-medium text-sm mt-2 text-center">
                    {ub.badge.name}
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {ub.badge.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No badges yet. Keep learning to earn achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member since */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-gray-500">
            <Calendar className="h-5 w-5" />
            <span>
              Member since{' '}
              {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
