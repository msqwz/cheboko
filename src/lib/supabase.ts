import { createClient } from '@supabase/supabase-js';
import { User, Location, Equipment, Ticket, Notification, Settings } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[SUPABASE] Warning: Missing environment variables for Supabase client initialization.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Типы для таблиц теперь импортируются из @/types/database
export type { User, Location, Equipment, Ticket, Notification, Settings };

// Вспомогательные функции для прямых SQL запросов
export async function sqlQuery<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: query,
    sql_params: params 
  });
  
  if (error) throw error;
  return data as T[];
}
