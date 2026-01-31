'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Layers,
  MessageSquare,
  Trophy,
  User,
  Settings,
  GraduationCap,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Learn', href: '/learn', icon: BookOpen },
  { name: 'Review', href: '/review', icon: RefreshCw },
  { name: 'Practice Modes', href: '/modes', icon: Layers },
  { name: 'Ask AI', href: '/ask-ai', icon: MessageSquare },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-zinc-900 border-r border-amber-200 dark:border-zinc-700 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <GraduationCap className="h-8 w-8 text-amber-600" />
            <span className="text-xl font-bold text-amber-800 dark:text-amber-400">
              Latin Learner
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href || pathname.startsWith(item.href + '/')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'text-gray-700 hover:bg-amber-50 hover:text-amber-800 dark:text-gray-300 dark:hover:bg-zinc-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                        )}
                      >
                        <item.icon
                          className={cn(
                            pathname === item.href || pathname.startsWith(item.href + '/')
                              ? 'text-amber-600'
                              : 'text-gray-400 group-hover:text-amber-600',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Link
                  href="/profile/settings"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-amber-50 hover:text-amber-800 dark:text-gray-300 dark:hover:bg-zinc-800"
                >
                  <Settings
                    className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-amber-600"
                    aria-hidden="true"
                  />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-zinc-900 border-t border-amber-200 dark:border-zinc-700">
        <nav className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center p-2 text-xs',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-amber-600'
                  : 'text-gray-500'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
