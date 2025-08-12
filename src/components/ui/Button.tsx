import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = clsx(
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
    {
      // Variants
      'bg-primary text-white shadow hover:bg-primary/90 focus:ring-primary/50': variant === 'primary',
      'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
      'border border-border bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus:ring-destructive/50': variant === 'destructive',
      
      // Sizes
      'h-8 px-3 text-sm rounded-md': size === 'sm',
      'h-10 px-4 py-2 text-sm rounded-lg': size === 'md',
      'h-12 px-6 py-3 text-base rounded-lg': size === 'lg',
      
      // Full width
      'w-full': fullWidth,
    },
    className
  );

  const iconElement = loading ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
    </motion.div>
  ) : icon;

  return (
    <motion.button
      className={baseClasses}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        whileHover={{ translateX: "200%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {iconElement && iconPosition === 'left' && iconElement}
      
      <span className="relative z-10">{children}</span>
      
      {iconElement && iconPosition === 'right' && iconElement}
    </motion.button>
  );
};
