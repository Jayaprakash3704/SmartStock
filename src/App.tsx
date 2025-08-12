import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authAPI } from './services/api';
import { User } from './types';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { notificationManager } from './services/notificationManager';
import { isFirebaseEnabled } from './services/firebase';
import { migrateLocalProductsToFirestore } from './services/migration';
import { Layout } from './components/ui/Layout';
import { LoadingPage } from './components/ui/Loading';
import './styles/globals.css';

// Import pages
import Dashboard from './pages/dashboard_dynamic';
import Inventory from './pages/inventory_dynamic';
import Products from './pages/products';
import Reports from './pages/reports';
import Settings from './pages/settings';
import Users from './pages/users';

// Dedicated Sign In page
import SignIn from './pages/signin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'products' | 'inventory' | 'reports' | 'settings' | 'users'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  // Initialize dynamic features when user logs in
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        notificationManager.showInfo(
          '🚀 Welcome to SmartStock!',
          'Your modern inventory management system is ready to use.'
        );
      }, 1000);

      // Migrate local data to Firestore if available
      if (isFirebaseEnabled()) {
        migrateLocalProductsToFirestore().then(res => {
          if (res && res.imported > 0) {
            notificationManager.showSuccess('Data Sync', `${res.imported} products synced successfully`);
          }
        });
      }
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return <LoadingPage message="Loading SmartStock..." />;
  }

  if (!user) {
    return <SignIn onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={(page) => setCurrentPage(page as typeof currentPage)}
    >
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {renderCurrentPage()}
      </motion.div>
    </Layout>
  );
};

export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </ThemeProvider>
  );
}
