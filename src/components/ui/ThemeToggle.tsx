import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemePreference } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { preference, setPreference } = useTheme();

  const themes: { key: ThemePreference; icon: React.ReactNode; label: string }[] = [
    { key: 'light', icon: <Sun size={16} />, label: 'Light' },
    { key: 'dark', icon: <Moon size={16} />, label: 'Dark' },
    { key: 'system', icon: <Monitor size={16} />, label: 'System' },
  ];

  return (
    <div className={`relative inline-flex bg-secondary/20 rounded-full p-1 ${className}`}>
      <motion.div
        className="absolute inset-y-1 w-8 bg-primary/20 rounded-full"
        layoutId="theme-toggle-bg"
        initial={false}
        animate={{
          x: themes.findIndex(t => t.key === preference) * 36,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      {themes.map(({ key, icon, label }) => (
        <motion.button
          key={key}
          onClick={() => setPreference(key)}
          className={`
            relative z-10 p-2 rounded-full transition-colors duration-200
            ${preference === key 
              ? 'text-primary' 
              : 'text-muted hover:text-foreground'
            }
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <motion.div
            initial={false}
            animate={{ rotate: preference === key ? 360 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.div>
        </motion.button>
      ))}
    </div>
  );
};
