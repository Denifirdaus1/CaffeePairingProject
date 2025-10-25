import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../components/Dashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Dashboard />
    </div>
  );
};
