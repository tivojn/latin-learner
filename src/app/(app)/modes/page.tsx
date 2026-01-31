import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Layers,
  CreditCard,
  FileText,
  ListChecks,
  Keyboard,
  Grid3X3,
} from 'lucide-react'

const modes = [
  {
    name: 'Flashcards',
    href: '/modes/flashcards',
    description: 'Classic flip cards with spaced repetition',
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    name: 'Fanfold',
    href: '/modes/fanfold',
    description: 'Progressive reveal for deeper learning',
    icon: Layers,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    name: 'Cloze',
    href: '/modes/cloze',
    description: 'Fill in the missing word in context',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    name: 'Multiple Choice',
    href: '/modes/multiple-choice',
    description: 'Pick the correct translation',
    icon: ListChecks,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    name: 'Typing',
    href: '/modes/typing',
    description: 'Type the translation for active recall',
    icon: Keyboard,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    name: 'Matching',
    href: '/modes/matching',
    description: 'Match Latin words to English meanings',
    icon: Grid3X3,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
  },
]

export default function ModesPage() {
  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
          Practice Modes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Different ways to test and reinforce your knowledge
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((mode) => (
          <Link key={mode.name} href={mode.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${mode.bgColor} flex items-center justify-center mb-2`}>
                  <mode.icon className={`h-6 w-6 ${mode.color}`} />
                </div>
                <CardTitle className="text-lg">{mode.name}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
