import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import RealtimeTodos from '@/components/RealtimeTodos'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Todos</h1>
      <RealtimeTodos initialTodos={todos || []} />
    </div>
  )
}
