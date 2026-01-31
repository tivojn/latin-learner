import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Star, Flame } from 'lucide-react'
import type { Profile } from '@/types/database'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get top users by XP
  const { data: topByXP } = await supabase
    .from('profiles')
    .select('*')
    .order('xp_points', { ascending: false })
    .limit(20) as { data: Profile[] | null }

  // Get top users by streak
  const { data: topByStreak } = await supabase
    .from('profiles')
    .select('*')
    .order('current_streak', { ascending: false })
    .limit(10) as { data: Profile[] | null }

  // Get current user's rank
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user!.id)
    .single() as { data: Profile | null }

  const userRank = topByXP?.findIndex(p => p.user_id === user!.id) ?? -1

  return (
    <div className="space-y-8 pb-20 lg:pb-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          See how you compare to other Latin learners
        </p>
      </div>

      {/* Your rank */}
      {userProfile && (
        <Card className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xl font-bold text-amber-800 dark:text-amber-200">
                  {userRank >= 0 ? userRank + 1 : '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Your Ranking
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userProfile.username || 'Anonymous'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="gap-1 bg-amber-200 text-amber-800">
                  <Star className="h-3 w-3" />
                  {userProfile.xp_points} XP
                </Badge>
                <Badge className="gap-1 bg-orange-200 text-orange-800">
                  <Flame className="h-3 w-3" />
                  {userProfile.current_streak} days
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top by XP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            Top Learners by XP
          </CardTitle>
          <CardDescription>
            Overall experience points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topByXP?.map((profile, index) => (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  profile.user_id === user!.id
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-gray-50 dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index < 3 ? (
                      <Medal className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`font-medium ${
                    profile.user_id === user!.id ? 'text-amber-800 dark:text-amber-200' : ''
                  }`}>
                    {profile.username || 'Anonymous'}
                  </span>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {profile.xp_points}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top by Streak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            Longest Streaks
          </CardTitle>
          <CardDescription>
            Most consistent learners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topByStreak?.map((profile, index) => (
              <div
                key={profile.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  profile.user_id === user!.id
                    ? 'bg-orange-100 dark:bg-orange-900/30'
                    : 'bg-gray-50 dark:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-orange-500 text-white' :
                    index === 1 ? 'bg-orange-400 text-white' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`font-medium ${
                    profile.user_id === user!.id ? 'text-orange-800 dark:text-orange-200' : ''
                  }`}>
                    {profile.username || 'Anonymous'}
                  </span>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {profile.current_streak} days
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
