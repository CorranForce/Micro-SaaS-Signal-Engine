import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import RealtimeTodos from '@/components/RealtimeTodos'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let todos: any[] = []
  let errorMsg = ""

  try {
    // Add a race condition to ensure we don't block the page render indefinitely if Supabase is stuck or unreachable
    const queryPromise = supabase.from('todos').select()
    const timeoutPromise = new Promise<{ data: null, error: Error }>((_, reject) => 
      setTimeout(() => reject(new Error("Supabase request timed out after 3 seconds. Please verify your project status or settings.")), 3000)
    )

    const response = await Promise.race([queryPromise, timeoutPromise]) as any
    if (response && response.error) {
      console.warn("Supabase Warning standard select:", response.error)
      errorMsg = response.error.message || "An error occurred fetching todos."
    } else if (response) {
      todos = response.data || []
    }
  } catch (e: any) {
    console.warn("Failed to query Supabase Todos (graceful error state shown):", e)
    errorMsg = e.message || "Failed to reach the database."
  }

  return (
    <div className="p-8 font-ms">
      <h1 className="text-2xl font-bold mb-4 text-white">Supabase Todos</h1>
      
      {errorMsg && (
        <div className="bg-ms-red-dark/10 border border-ms-red/20 p-4 mb-6 rounded-sm text-xs max-w-xl">
          <span className="text-ms-red font-bold">Database Connection Flagged:</span>
          <p className="text-ms-text text-[11px] mt-1 font-mono">{errorMsg}</p>
          <p className="text-ms-text-muted text-[10px] mt-2">
            💡 If you recently reset your database password in the Supabase console, your instance may be restarting. 
            Once active, make sure your project credentials are saved correctly in the <strong>System Settings</strong> page.
          </p>
        </div>
      )}

      <RealtimeTodos initialTodos={todos} />
    </div>
  )
}
