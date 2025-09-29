import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  DollarSign
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';
import { NotificationBell } from './NotificationBell';
import type { User } from '../../types';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut?: () => void;
  user?: User;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Overview & KPIs', icon: Home },
  { id: 'inventory', label: 'Inventory', sub: 'Stock & Reorders', icon: Package },
  { id: 'products', label: 'Products', sub: 'Catalog & Pricing', icon: ShoppingCart },
  { id: 'sales', label: 'Sales', sub: 'Transactions & Revenue', icon: DollarSign },
  { id: 'reports', label: 'Reports', sub: 'Analytics & Insights', icon: BarChart3 },
  { id: 'users', label: 'Users', sub: 'Team & Roles', icon: Users },
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, onSignOut, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = (user?.username || user?.email || 'Admin') as string;
  const initials = displayName
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'A';

  const MobileNavItem: React.FC<{ item: typeof navigationItems[0] }> = ({ item }) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;

    return (
      <motion.button
        onClick={() => {
          onPageChange(item.id);
          setIsMobileMenuOpen(false);
        }}
        className={`
          relative flex items-center gap-4 w-full px-4 py-4 rounded-xl text-left font-medium
          transition-all duration-300 group
          ${isActive 
            ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30' 
            : 'text-muted hover:text-foreground hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/10'
          }
        `}
        whileHover={{ 
          scale: 1.02, 
          x: 8,
          transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Glow effect for active item */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 opacity-20 blur-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
        )}
        
        <Icon 
          size={22} 
          className={`relative z-10 transition-all duration-300 group-hover:scale-110 ${
            isActive ? 'text-white drop-shadow-sm' : ''
          }`} 
        />
        <div className={`relative z-10 ${isActive ? 'text-white' : ''}`}>
          <div className="font-semibold text-base">{item.label}</div>
          <div className={`text-sm opacity-75 ${isActive ? 'text-white/80' : 'text-muted'}`}>
            {item.sub}
          </div>
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute right-3 w-2 h-8 bg-white/40 rounded-full"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Desktop Modern Navigation Bar */}
      <motion.nav
        className="hidden lg:block bg-gradient-to-r from-card via-card/95 to-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-lg text-foreground"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-18 py-2">
            {/* Brand Section - Fixed width */}
            <motion.div 
              className="flex items-center gap-3 min-w-[240px]"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  SmartStock
                </h1>
                <p className="text-xs text-muted font-medium">POS & Inventory System</p>
              </div>
            </motion.div>

            {/* Navigation Items - Centered */}
            <div className="flex items-center justify-center gap-1 flex-1">
              {navigationItems.map((item, index) => {
                const isActive = currentPage === item.id;
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`
                      relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 group
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30' 
                        : 'text-muted hover:text-foreground hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/10'
                      }
                    `}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + (index * 0.05) }}
                    whileHover={{ 
                      y: -2,
                      scale: 1.05,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Glow effect for active item */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 opacity-20 blur-lg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.3, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                    
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Icon size={18} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                      <span className="font-semibold">{item.label}</span>
                    </span>

                    {/* Active indicator line */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 w-8 h-0.5 bg-white/50 rounded-full"
                        initial={{ width: 0, x: "-50%" }}
                        animate={{ width: 32, x: "-50%" }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Right Actions - Fixed width and properly aligned */}
            <motion.div 
              className="flex items-center gap-3 min-w-[320px] justify-end"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* User Info First */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border/60 bg-card shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white flex items-center justify-center text-sm font-bold shadow-primary/30 shadow">
                  {initials}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold max-w-[9rem] truncate text-left">{displayName}</div>
                  <div className="text-[11px] text-muted text-left">{user?.role ?? 'admin'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <NotificationBell />
                <motion.button
                  onClick={() => onPageChange('settings')}
                  className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-accent/30 transition-all duration-200"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings size={18} />
                </motion.button>
                
                <ThemeToggle />

                <motion.button
                  onClick={onSignOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={16} />
                  <span className="hidden xl:inline">Sign Out</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Header */}
      <motion.header
        className="lg:hidden bg-gradient-to-r from-card via-card/95 to-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-lg text-foreground"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                SmartStock
              </h1>
              <p className="text-xs text-muted font-medium">POS & Inventory</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User info for mobile */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border/60 bg-card">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold max-w-[5rem] truncate">{displayName.split(' ')[0]}</div>
              </div>
            </div>
            
            <ThemeToggle />
            <motion.button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 rounded-xl text-foreground hover:bg-accent/30 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={20} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <motion.div
            className="fixed top-0 left-0 w-80 h-full bg-gradient-to-b from-card to-card/95 z-50 lg:hidden shadow-2xl border-r border-border/50 backdrop-blur-lg"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    SmartStock
                  </h1>
                  <p className="text-sm text-muted font-medium">POS & Inventory System</p>
                </div>
              </div>
              
              <motion.button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-accent/30 transition-all duration-200"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="p-4 space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, type: "spring", stiffness: 300, damping: 25 }}
                >
                  <MobileNavItem item={item} />
                </motion.div>
              ))}
              {/* Settings as a mobile item */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * (navigationItems.length + 1), type: "spring", stiffness: 300, damping: 25 }}
              >
                <MobileNavItem item={{ id: 'settings', label: 'Settings', sub: 'Preferences', icon: Settings } as any} />
              </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30 bg-card">
              {/* Mobile user chip */}
              <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-xl border border-border/60 bg-card">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{displayName}</div>
                  <div className="text-[11px] text-muted">{user?.role ?? 'admin'}</div>
                </div>
              </div>
              <motion.button
                onClick={() => { onSignOut?.(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left font-medium text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
};
