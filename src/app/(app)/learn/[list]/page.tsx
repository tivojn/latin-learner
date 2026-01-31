import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LearnSession } from '@/components/learn-session'
import type { Vocabulary, UserVocabProgress, Derivative, Mnemonic, ExampleSentence } from '@/types/database'

interface Props {
  params: Promise<{ list: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function LearnListPage({ params, searchParams }: Props) {
  const { list } = await params
  const { mode } = await searchParams
  const listNumber = parseInt(list, 10)
  const practiceAll = mode === 'practice'

  if (isNaN(listNumber)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get vocabulary for this list
  const { data: vocabulary } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('list', listNumber)
    .order('id') as { data: Vocabulary[] | null }

  if (!vocabulary || vocabulary.length === 0) {
    notFound()
  }

  // Get user progress for this vocabulary
  const vocabIds = vocabulary.map(v => v.id)
  const { data: progress } = await supabase
    .from('user_vocab_progress')
    .select('*')
    .eq('user_id', user!.id)
    .in('vocab_id', vocabIds) as { data: UserVocabProgress[] | null }

  // Get derivatives for vocabulary
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
    <LearnSession
      listNumber={listNumber}
      vocabulary={vocabulary}
      progress={progress || []}
      derivatives={derivatives || []}
      mnemonics={mnemonics || []}
      examples={examples || []}
      userId={user!.id}
      practiceAll={practiceAll}
    />
  )
}
