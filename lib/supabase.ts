import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TrainingGoal = 'weight-loss' | 'muscle-gain' | 'maintenance' | 'endurance';

export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};


export interface UserProfile {
  id: string;
  name: string;
  cpf: string;
  username: string;
  weight: number;
  basal_rate: number;
  training_goal: TrainingGoal;
  created_at: string;
  updated_at: string;
}