const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('Creating TicketHistory table...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS "TicketHistory" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "ticketId" TEXT NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
      "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      "oldValue" TEXT,
      "newValue" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON "TicketHistory"("ticketId");
    
    -- Add safe access policies
    ALTER TABLE "TicketHistory" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role has full access" ON "TicketHistory" FOR ALL USING (true);
  `;

  // Note: supabase-js doesn't have a direct .rpc('exec_sql') unless we created it.
  // We'll try to use the REST API to check if we can run it, or just use psql if available.
  // Since I don't have exec_sql RPC, I'll advise the user to run it or try to find another way.
  // Actually, I can use the 'postgres' package if it's installed to connect directly.
  
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(sql);
}

createTable();
