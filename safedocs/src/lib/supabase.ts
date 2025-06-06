import { supabaseAnonKey, supabaseUrl } from '@/config/site'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);