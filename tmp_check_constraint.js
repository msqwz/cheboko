const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'User_role_check'" 
  });
  console.log(JSON.stringify({ data, error }, null, 2));
}

check();
