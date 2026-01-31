import { redirect } from 'next/navigation'

// Flashcards mode redirects to the main review page
// as it uses the same flashcard-based SRS system
export default function FlashcardsModePage() {
  redirect('/review')
}
