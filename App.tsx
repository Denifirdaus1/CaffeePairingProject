import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';

// Lazy load pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PublicShopPage = lazy(() => import('./pages/PublicShopPage').then(m => ({ default: m.PublicShopPage })));
const PublicCoffeePage = lazy(() => import('./pages/PublicCoffeePage').then(m => ({ default: m.PublicCoffeePage })));
const PublicPastryPage = lazy(() => import('./pages/PublicPastryPage').then(m => ({ default: m.PublicPastryPage })));
const PublicPairingPage = lazy(() => import('./pages/PublicPairingPage').then(m => ({ default: m.PublicPairingPage })));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#12100f]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#ffca8c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[#e8e1da] text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              } 
            />
            {/* Public Shop Routes */}
            <Route path="/s/:shop" element={<PublicShopPage />} />
            <Route path="/s/:shop/coffee/:slug" element={<PublicCoffeePage />} />
            <Route path="/s/:shop/pastry/:slug" element={<PublicPastryPage />} />
            <Route path="/s/:shop/pairing/:slug" element={<PublicPairingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <SpeedInsights />
      </Router>
    </AuthProvider>
  );
}

export default App;