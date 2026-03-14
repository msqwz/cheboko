const supabaseUrl = "https://ijfxeuvrtcxhbvbgdeuf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnhldXZydGN4aGJ2YmdkZXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjk5MzgsImV4cCI6MjA4ODkwNTkzOH0._s56clkL6xjPSip_6OJXjnlwt7uU3sjrygKH3zQQExk";

async function checkLocations() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/Location?select=id,name,address`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Error fetching locations: ${res.status} ${text}`);
      return;
    }

    const data = await res.json();
    console.log(`Locations found: ${data.length}`);
    data.forEach(loc => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loc.id);
      console.log(`ID: ${loc.id}, Name: ${loc.name}, isUUID: ${isUUID}`);
    });
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

checkLocations();
