import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContextNew';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative p-2.5 rounded-xl overflow-hidden
        transition-all duration-300
        ${isDark 
          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
          : 'bg-slate-500/20 text-slate-600 hover:bg-slate-500/30'
        }
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Background glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-xl ${
          isDark 
            ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20' 
            : 'bg-gradient-to-r from-slate-400/20 to-slate-600/20'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Icon container */}
      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ 
          rotate: isDark ? 180 : 0,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 0.5, ease: 'easeInOut' },
          scale: { duration: 0.3, times: [0, 0.5, 1] }
        }}
      >
        {isDark ? (
          <Sun size={18} className="drop-shadow-sm" />
        ) : (
          <Moon size={18} className="drop-shadow-sm" />
        )}
      </motion.div>

      {/* Sparkle animation for theme switch */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
      >
        <div className={`absolute top-1 right-1 w-1 h-1 rounded-full ${
          isDark ? 'bg-yellow-300' : 'bg-slate-400'
        }`} />
        <div className={`absolute bottom-1 left-1 w-0.5 h-0.5 rounded-full ${
          isDark ? 'bg-yellow-400' : 'bg-slate-500'
        }`} />
      </motion.div>
    </motion.button>
  );
};
