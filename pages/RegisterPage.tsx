import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { Spinner } from '../components/Spinner';
import { Toast } from '../components/Toast';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    cafe_name: '',
    cafe_description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    website: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await signUp(formData);
      setToast({ message: 'Account created successfully!', type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setToast({ message: err.message || 'Registration failed', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-3xl bg-brand-primary/80 p-4 text-brand-accent shadow-2xl ring-1 ring-brand-accent/40">
              <CoffeeIcon className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
          <p className="mt-2 text-brand-text/70">Start your café's AI-powered journey</p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cafe_name" className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Name *
              </label>
              <input
                id="cafe_name"
                name="cafe_name"
                type="text"
                required
                value={formData.cafe_name}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Your café name"
              />
            </div>

            <div>
              <label htmlFor="cafe_description" className="block text-sm font-medium text-brand-text/90 mb-2">
                Café Description
              </label>
              <textarea
                id="cafe_description"
                name="cafe_description"
                rows={3}
                value={formData.cafe_description}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Tell us about your café..."
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-brand-text/90 mb-2">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Your city"
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-brand-text/90 mb-2">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                  placeholder="Your country"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/40 p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button-primary-pulse w-full rounded-xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-brand-text/50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-brand-text/70">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand-accent hover:text-brand-accent/80 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
