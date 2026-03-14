import { createClient } from '@supabase/supabase-js';
import { User, Location, Equipment, Ticket, Notification, Settings } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Клиент для серверных операций (API routes) — использует service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Клиент для клиентских операций (realtime, публичные запросы) — использует anon key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.warn('[SUPABASE] Warning: Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  console.warn('[SUPABASE] Warning: Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Основной клиент для API routes — предпочитаем service role key
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

// Публичный клиент только для браузера (realtime подписки)
export const supabasePublic = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type { User, Location, Equipment, Ticket, Notification, Settings };

export async function sqlQuery<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: query,
    sql_params: params
  });

  if (error) throw error;
  return data as T[];
}
