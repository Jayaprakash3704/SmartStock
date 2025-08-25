import React, { useState } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import { authAPI } from '../services/api';
import { User } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface SignInProps {
  onLogin: (user: User) => void;
  onSwitchToSignUp?: () => void;
}

const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    } 
  },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

const cardVariants: Variants = {
  initial: { y: 32, opacity: 0, scale: 0.95, rotateX: 10 },
  animate: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    rotateX: 0,
    transition: { 
      type: 'spring', 
      stiffness: 280, 
      damping: 24,
      duration: 0.8
    } 
  },
  exit: { y: -16, opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const fieldVariants: Variants = {
  initial: { opacity: 0, y: 16, x: -8 },
  animate: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    x: 0,
    transition: { 
      delay: 0.1 * i,
      type: 'spring',
      stiffness: 300,
      damping: 25
    } 
  }),
};

const iconVariants: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.2
    }
  },
  hover: { 
    scale: 1.1, 
    rotate: 5,
    transition: { duration: 0.2 }
  }
};

export default function SignIn({ onLogin, onSwitchToSignUp }: SignInProps) {
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await authAPI.login({ username: email, password });
      if (res.success) {
        if (!remember) localStorage.removeItem('authToken');
        onLogin(res.data.user);
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        padding: '20px',
        background: 'var(--bg)',
        WebkitTapHighlightColor: 'transparent',
      }}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      <motion.div
        className="auth-card relative z-10"
        style={{ 
          width: '100%', 
          maxWidth: 520, 
          willChange: 'transform, opacity',
        }}
        variants={prefersReducedMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : cardVariants}
      >
        <Card padding="xl">
          <motion.div 
            className="auth-header" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.div
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, var(--primary-solid), var(--accent-solid))',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 20px 40px -12px rgba(59, 130, 246, 0.4)',
                position: 'relative',
                overflow: 'hidden',
              }}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                }}
                animate={{
                  x: [-100, 100],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                style={{ fontSize: '32px' }}
                animate={prefersReducedMotion ? {} : { 
                  rotate: [0, 5, -5, 0], 
                  scale: [1, 1.05, 1] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: 'easeInOut',
                  repeatDelay: 1
                }}
              >
                📦
              </motion.div>
            </motion.div>
            
            <motion.h1 
              className="auth-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              SmartStock
            </motion.h1>
            
            <motion.p 
              className="auth-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Welcome back! Sign in to manage your inventory with style.
            </motion.p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sign in form">
            <motion.div 
              custom={0} 
              variants={prefersReducedMotion ? undefined : fieldVariants} 
              initial="initial" 
              animate="animate"
            >
              <label className="form-label" htmlFor="email">
                📧 Email Address
              </label>
              <motion.input
                id="email"
                type="email"
                className="modern-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                inputMode="email"
                autoComplete="email"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </motion.div>

            <motion.div 
              custom={1} 
              variants={prefersReducedMotion ? undefined : fieldVariants} 
              initial="initial" 
              animate="animate"
            >
              <label className="form-label" htmlFor="password">
                🔒 Password
              </label>
              <div style={{ position: 'relative' }}>
                <motion.input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="modern-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '60px' }}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                <motion.button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                  className="btn-icon"
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              custom={2} 
              variants={prefersReducedMotion ? undefined : fieldVariants} 
              initial="initial" 
              animate="animate" 
              className="inline-group"
            >
              <label className="checkbox">
                <motion.input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
                <span className="checkbox-label">Remember me</span>
              </label>
              <motion.button 
                type="button" 
                className="btn-link" 
                onClick={() => setError('Password reset is not configured.')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Forgot password?
              </motion.button>
            </motion.div>

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="alert alert-danger"
                role="alert"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Primary Actions */}
            <motion.div 
              className="space-y-4"
              custom={3}
              variants={prefersReducedMotion ? undefined : fieldVariants}
              initial="initial"
              animate="animate"
            >
              <Button 
                type="submit" 
                loading={isLoading} 
                fullWidth 
                size="lg" 
                className="font-semibold text-lg py-4"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-solid), var(--accent-solid))',
                  border: 'none',
                  boxShadow: '0 8px 32px -8px rgba(59, 130, 246, 0.4)',
                }}
              >
                🚀 Sign In
              </Button>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ textAlign: 'center' }}
              >
                <span style={{ 
                  padding: '0 16px', 
                  background: 'var(--surface)', 
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  or continue with
                </span>
              </motion.div>
              
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={async () => {
                  const res = await authAPI.loginWithGoogle();
                  if (res.success) onLogin(res.data.user); 
                  else setError(res.error || 'Google login failed');
                }}
                className="py-4 font-semibold border-2"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                }}
              >
                <span style={{ marginRight: '8px' }}>🌐</span>
                Sign in with Google
              </Button>
            </motion.div>

            {/* Create Account CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ textAlign: 'center', paddingTop: '16px' }}
            >
              <p className="helper-text">
                New to SmartStock?{' '}
                <motion.button 
                  type="button" 
                  className="btn-link" 
                  onClick={() => onSwitchToSignUp?.()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontWeight: '600' }}
                >
                  Create your account →
                </motion.button>
              </p>
            </motion.div>
          </form>

          <motion.div
            className="mt-8 p-4 rounded-2xl"
            style={{ 
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <p className="helper-text text-center" style={{ lineHeight: 1.6 }}>
              💡 <strong>Pro Tip:</strong> Use your registered email and password. 
              New user? Contact admin for account setup.
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
