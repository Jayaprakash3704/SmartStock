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
  LogOut
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Overview & KPIs', icon: Home },
  { id: 'inventory', label: 'Inventory', sub: 'Stock & Reorders', icon: Package },
  { id: 'products', label: 'Products', sub: 'Catalog & Pricing', icon: ShoppingCart },
  { id: 'reports', label: 'Reports', sub: 'Sales & Insights', icon: BarChart3 },
  { id: 'users', label: 'Users', sub: 'Team & Roles', icon: Users },
  { id: 'settings', label: 'Settings', sub: 'Preferences', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem: React.FC<{ item: typeof navigationItems[0]; isMobile?: boolean }> = ({ 
    item, 
    isMobile = false 
  }) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;

    return (
      <motion.button
        onClick={() => {
          onPageChange(item.id);
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={`
          relative flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left
          transition-all duration-200 group
          ${isActive 
            ? 'bg-primary text-white shadow-md' 
            : 'text-muted hover:text-foreground hover:bg-accent/50'
          }
          ${isMobile ? 'text-lg py-4' : ''}
        `}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute inset-0 bg-primary rounded-lg"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        
        <Icon 
          size={isMobile ? 24 : 20} 
          className={`relative z-10 transition-transform group-hover:scale-110 ${
            isActive ? 'text-white' : ''
          }`} 
        />
        <span className={`relative z-10 font-medium ${isActive ? 'text-white' : ''}`}>
          {item.label}
          <span className={`block text-xs ${isActive ? 'text-white/80' : 'text-muted'} mt-0.5`}>{item.sub}</span>
        </span>
        
        {isActive && (
          <motion.div
            className="absolute right-0 w-1 h-8 bg-white/30 rounded-l-full"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.1 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav
        className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r border-border h-screen sticky top-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="p-6 border-b border-border">
          <motion.div
            className="flex items-center gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">SmartStock</h1>
              <p className="text-sm text-muted">Inventory System</p>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <NavItem item={item} />
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <ThemeToggle className="w-full justify-center" />
          <Button
            variant="ghost"
            fullWidth
            icon={<LogOut size={16} />}
            className="justify-start text-muted hover:text-destructive"
          >
            Sign Out
          </Button>
        </div>
      </motion.nav>

      {/* Mobile Header */}
      <motion.header
        className="lg:hidden bg-card border-b border-border sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold font-display">SmartStock</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
              icon={<Menu size={20} />}
            >
              Menu
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <motion.div
            className="fixed top-0 left-0 w-80 h-full bg-card z-50 lg:hidden shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-display">SmartStock</h1>
                  <p className="text-sm text-muted">Inventory System</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                icon={<X size={20} />}
              >
                Close
              </Button>
            </div>

            <div className="p-4 space-y-2">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <NavItem item={item} isMobile />
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <Button
                variant="ghost"
                fullWidth
                icon={<LogOut size={16} />}
                className="justify-start text-muted hover:text-destructive"
              >
                Sign Out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </>
  );
};
