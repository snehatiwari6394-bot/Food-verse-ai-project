import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type ScanRow = {
  id: string;
  category: 'recognition' | 'freshness';
  image_ref: string | null;
  image_name: string | null;
  payload: Record<string, unknown>;
  confidence: number | null;
  score: number | null;
  created_at: string;
};

export type HygieneRow = {
  id: string;
  restaurant_name: string;
  image_ref: string | null;
  payload: Record<string, unknown>;
  overall_score: number | null;
  grade: string | null;
  created_at: string;
};

export type CookingRow = {
  id: string;
  dish: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type NutritionLogRow = {
  id: string;
  log_date: string;
  meal: string | null;
  item: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string;
  goal: string;
  dietary_prefs: string[];
  allergies: string[];
  daily_calorie_target: number;
  updated_at: string;
};
