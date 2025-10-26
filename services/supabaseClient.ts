import { createClient } from '@supabase/supabase-js';
import type { Coffee, Pastry } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadImage = async (file: File, bucket: 'coffee-images' | 'pastry-images'): Promise<{ publicUrl: string; path: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = fileName;

    const { error } = await supabase.storage.from(bucket).upload(filePath, file);

    if (error) {
        console.error('Image Upload Error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { publicUrl: data.publicUrl, path: filePath };
};

export const deleteImage = async (bucket: 'coffee-images' | 'pastry-images', path: string): Promise<void> => {
    if (!path) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
        // Log error but don't throw, to not interrupt a successful DB update/delete flow
        console.error('Image Deletion Error:', error.message);
    }
};


// Type helpers for database tables
export type CoffeeInsert = Omit<Coffee, 'id' | 'created_at' | 'updated_at'>;
export type PastryInsert = Omit<Pastry, 'id' | 'created_at' | 'updated_at'>;

export type CoffeeUpdate = Partial<Omit<Coffee, 'id' | 'created_at' | 'updated_at' | 'cafe_id'>>;
export type PastryUpdate = Partial<Omit<Pastry, 'id' | 'created_at' | 'updated_at' | 'cafe_id'>>;