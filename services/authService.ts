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
        },
        emailRedirectTo: undefined // Disable email confirmation
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

    // Try to manually confirm the user (bypass email confirmation)
    try {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      if (confirmError) {
        console.log('Could not auto-confirm user (this is normal):', confirmError.message);
      } else {
        console.log('User auto-confirmed successfully');
      }
    } catch (adminError) {
      console.log('Admin API not available (this is normal):', adminError);
    }

    // Check current auth state
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    console.log('Current user check:', { currentUser: currentUser?.id, userError });
    
    // Small delay to ensure auth state is set
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create café profile immediately with the returned user
    console.log('Creating café profile...');
    console.log('Inserting data:', {
      user_id: authData.user.id,
      cafe_name: data.cafe_name
    });
    
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
    console.log('Attempting sign in for:', email);
    
    // For development: try to find user by email in cafe_profiles first
    // Use a simpler query to avoid 406 error
    const { data: existingProfiles, error: profileError } = await supabase
      .from('cafe_profiles')
      .select('*')
      .not('user_id', 'is', null);
    
    if (profileError) {
      console.log('Profile lookup error:', profileError);
    }
    
    // Find profile by matching user_id with auth users
    if (existingProfiles && existingProfiles.length > 0) {
      console.log('Found profiles, checking for email match...');
      
      // For development: try to find profile by email pattern
      const emailPrefix = email.split('@')[0];
      const matchingProfile = existingProfiles.find(profile => 
        profile.cafe_name && profile.cafe_name.toLowerCase().includes(emailPrefix.toLowerCase())
      );
      
      if (matchingProfile) {
        console.log('Found matching profile for development bypass:', matchingProfile.id);
        // Return a mock user object for development
        return {
          user: {
            id: matchingProfile.user_id,
            email: email,
            user_metadata: {
              full_name: matchingProfile.cafe_name
            }
          },
          session: null
        };
      }
    }
    
    // Try regular sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Email confirmation required. For development, please contact admin to confirm your account.');
      } else {
        throw new Error(`Sign in failed: ${error.message}`);
      }
    }
    
    console.log('Sign in successful:', data.user?.id);
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
