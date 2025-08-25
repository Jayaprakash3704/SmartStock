import React from 'react';
import { motion } from 'framer-motion';
import { Navigation } from './Navigation';
import { User } from '../../types';

interface LayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut?: () => void;
  user?: User | null;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onPageChange, onSignOut, user, children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} onPageChange={onPageChange} onSignOut={onSignOut} user={user || undefined} />

      {/* Content below top navbar with proper spacing */}
      <motion.main
        className="w-full px-4 lg:px-6 py-6 lg:py-8 min-h-[calc(100vh-80px)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </div>
      </motion.main>
      
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-gradient-to-l from-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  );
};
