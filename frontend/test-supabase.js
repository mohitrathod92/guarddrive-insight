const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://hxertnhyiefnrsbsqbbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_2MlDj2NmmvKgJ_8_UVXeTA_RFGum_-3';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Error:', error);
    console.log('Data:', data);
  } catch (err) {
    console.log('Exception:', err);
  }
}

testSignIn();
