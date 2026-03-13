
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- EQUIPMENT COLUMNS ---');
  const { data: eqCols, error: eqErr } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'Equipment'" 
  });
  console.log(eqCols?.map(c => c.column_name) || eqErr);

  console.log('\n--- TICKET STATUSES ---');
  const { data: statuses, error: stErr } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT DISTINCT status FROM \"Ticket\"" 
  });
  console.log(statuses?.map(s => s.status) || stErr);

  console.log('\n--- NOTIFICATION COLUMNS ---');
  const { data: notifCols, error: ntErr } = await supabase.rpc('exec_sql', { 
    sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'Notification'" 
  });
  console.log(notifCols?.map(c => c.column_name) || ntErr);
}

check();
