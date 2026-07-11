import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserProfile = {
  id: string;
  email: string;
  plan: 'free' | 'weekly' | 'monthly' | 'yearly';
  coins_balance: number;
  coins_last_reset: string | null;
  subscription_expires_at: string | null;
  created_at: string;
};

export type VideoJob = {
  id: string;
  user_id: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  filters_used: string[];
  coins_spent: number;
  output_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  replicate_id: string | null;
  input_storage_path: string | null;
  output_storage_path: string | null;
  file_size_bytes: number | null;
  error_message: string | null;
  estimated_wait_seconds: number | null;
};

export type Payment = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  method: 'paypal' | 'visa' | 'mastercard' | 'google_play';
  coins_added: number;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
};
