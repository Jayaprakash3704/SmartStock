import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: 'default' | 'elevated' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  glow = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = clsx(
    'rounded-xl border bg-card text-card-foreground transition-all duration-300',
    {
      // Variants
      'shadow-soft': variant === 'default',
      'shadow-soft-lg border-0 bg-gradient-to-br from-card via-card to-muted/10': variant === 'elevated',
      'glass backdrop-blur-md': variant === 'glass',
      'gradient-primary text-white border-0': variant === 'gradient',
      
      // Padding
      'p-0': padding === 'none',
      'p-4': padding === 'sm',
      'p-6': padding === 'md',
      'p-8': padding === 'lg',
      
      // Hover effects
      'hover:shadow-soft-lg hover:-translate-y-1 cursor-pointer': hover,
      
      // Glow effect
      'shadow-glow hover:shadow-glow-lg': glow,
    },
    className
  );

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  animate?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  animate = true,
}) => {
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  };

  return (
    <Card variant="elevated" hover glow className="overflow-hidden">
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted mb-2">{title}</p>
            <motion.p
              className={`text-3xl font-bold ${colorClasses[color]}`}
              initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
              animate={animate ? { opacity: 1, scale: 1 } : undefined}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {value}
            </motion.p>
            {subtitle && (
              <p className="text-sm text-muted mt-1">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <motion.div
              className={`p-3 rounded-lg bg-${color}/10 ${colorClasses[color]}`}
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
          )}
        </div>
        
        {trend && (
          <motion.div
            className={`flex items-center gap-1 mt-3 text-sm ${
              trend.isPositive ? 'text-success' : 'text-error'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </motion.div>
        )}
        
        {/* Decorative background gradient */}
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
      </div>
    </Card>
  );
};
