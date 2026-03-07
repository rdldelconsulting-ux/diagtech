import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxbmcuzfbdxyhpjzqsll.supabase.co';
const supabaseKey = 'sb_publishable_iUdOkXWQ0Gg0L7BPRTJ8_w_RB8OyVJu';

export const supabase = createClient(supabaseUrl, supabaseKey);
