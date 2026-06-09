'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RealtimeTodos({ initialTodos }: { initialTodos: any[] }) {
  const [todos, setTodos] = useState(initialTodos);
  
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('realtime todos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setTodos((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
          } else if (payload.eventType === 'DELETE') {
            setTodos((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ul className="list-disc pl-5">
      {todos?.map((todo: any) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
