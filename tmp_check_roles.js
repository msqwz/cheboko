
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkRoles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('User')
    .select('role')
    .then(({ data }) => ({ data: [...new Set(data.map(u => u.role))] }));

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log('ROLES:', data);
}

checkRoles();
