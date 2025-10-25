import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PublicShopPage } from './pages/PublicShopPage';
import { PublicCoffeePage } from './pages/PublicCoffeePage';
import { AuthGuard } from './components/auth/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <Router>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;