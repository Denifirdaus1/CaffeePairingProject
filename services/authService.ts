import { supabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  full_name: string;
  cafe_profile?: CafeProfile;
}

export interface CafeProfile {
  id: string;
  cafe_name: string;
  cafe_description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  cafe_name: string;
  cafe_description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          cafe_name: data.cafe_name
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw authError;
    }
    if (!authData.user) throw new Error('User creation failed');

    // Wait a bit for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create café profile
    const { data: profileData, error: profileError } = await supabase
      .from('cafe_profiles')
      .insert({
        user_id: authData.user.id,
        cafe_name: data.cafe_name,
        cafe_description: data.cafe_description,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        website: data.website
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    return { user: authData.user, profile: profileData };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get café profile
    const { data: profile } = await supabase
      .from('cafe_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || '',
      cafe_profile: profile
    };
  },

  async updateCafeProfile(profileData: Partial<CafeProfile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('cafe_profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCafeId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('cafe_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    return profile?.id || null;
  }
};
