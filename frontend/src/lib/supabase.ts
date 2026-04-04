import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxertnhyiefnrsbsqbbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_2MlDj2NmmvKgJ_8_UVXeTA_RFGum_-3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
