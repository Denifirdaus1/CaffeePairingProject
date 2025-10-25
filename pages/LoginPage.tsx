import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CoffeeIcon } from '../components/icons/CoffeeIcon';
import { Spinner } from '../components/Spinner';
import { Toast } from '../components/Toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(email, password);
      setToast({ message: 'Welcome back!', type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setToast({ message: err.message || 'Login failed', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-3xl bg-brand-primary/80 p-4 text-brand-accent shadow-2xl ring-1 ring-brand-accent/40">
              <CoffeeIcon className="h-12 w-12" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-brand-text/70">Sign in to your café dashboard</p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-text/90 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-text/90 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-accent/50 rounded-xl p-3 text-brand-text focus:ring-brand-accent focus:border-brand-accent transition-colors"
                placeholder="Enter your password"
              />
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
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-brand-text/70">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-brand-accent hover:text-brand-accent/80 transition-colors"
                >
                  Sign up here
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
