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

// Rate limiting protection
let lastSignupAttempt = 0;
const SIGNUP_COOLDOWN = 6000; // 6 seconds cooldown

export const authService = {
  async signUp(data: SignUpData) {
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    
    if (timeSinceLastAttempt < SIGNUP_COOLDOWN) {
      const waitTime = SIGNUP_COOLDOWN - timeSinceLastAttempt;
      throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    lastSignupAttempt = now;

    console.log('Starting signup process...');

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
      // Handle rate limiting error specifically
      if (authError.message.includes('5 seconds')) {
        throw new Error('Please wait 5 seconds before trying to sign up again.');
      }
      throw authError;
    }
    
    if (!authData.user) {
      console.error('No user returned from signup');
      throw new Error('User creation failed');
    }

    console.log('User created successfully:', authData.user.id);

    // Small delay to ensure auth state is set
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create café profile immediately with the returned user
    console.log('Creating café profile...');
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
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    console.log('Profile created successfully:', profileData.id);

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
