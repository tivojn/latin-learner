'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Flame, Star, LogOut, User as UserIcon, Settings } from 'lucide-react'
import type { Profile } from '@/types/database'

interface HeaderProps {
  user: User
  profile: Profile | null
}

export function Header({ user, profile }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-amber-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile logo */}
        <span className="lg:hidden text-xl font-bold text-amber-800 dark:text-amber-400">
          Latin Learner
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Stats badges */}
        {profile && (
          <div className="hidden sm:flex items-center gap-3">
            <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
              <Flame className="h-3 w-3" />
              {profile.current_streak} day streak
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Star className="h-3 w-3" />
              {profile.xp_points} XP
            </Badge>
          </div>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || user.email || ''} />
                <AvatarFallback className="bg-amber-200 text-amber-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.username || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Mobile stats */}
            <div className="sm:hidden px-2 py-2 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{profile?.current_streak || 0} day streak</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-amber-500" />
                <span>{profile?.xp_points || 0} XP</span>
              </div>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/profile/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
