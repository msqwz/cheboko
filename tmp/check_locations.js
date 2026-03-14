const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local from the project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocations() {
  const { data, error } = await supabase.from('Location').select('id, name, address');
  if (error) {
    console.error('Error fetching locations:', error);
    return;
  }

  console.log('Locations found:');
  data.forEach(loc => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loc.id);
    console.log(`ID: ${loc.id}, Name: ${loc.name}, isUUID: ${isUUID}`);
  });
}

checkLocations();
