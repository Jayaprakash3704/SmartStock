import React, { useState } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import { authAPI } from '../services/api';
import { User } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface SignInProps {
  onLogin: (user: User) => void;
}

const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const cardVariants: Variants = {
  initial: { y: 18, opacity: 0, scale: 0.98 },
  animate: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit: { y: -8, opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

const fieldVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i } }),
};

export default function SignIn({ onLogin }: SignInProps) {
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
        className="min-h-screen flex items-center justify-center"
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, var(--bg), color-mix(in srgb, var(--primary) 6%, transparent))',
          WebkitTapHighlightColor: 'transparent',
        }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          className="auth-card"
          style={{ width: '100%', maxWidth: 520, willChange: 'transform, opacity' }}
          variants={prefersReducedMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : cardVariants}
        >
          <Card padding="lg">
            <motion.div className="auth-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, transparent))',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 6px 18px color-mix(in srgb, var(--primary) 35%, transparent)'
                }}
              >
                <motion.div
                  aria-hidden
                  animate={prefersReducedMotion ? { scale: 1 } : { rotate: [0, 4, -4, 0], scale: [1, 1.02, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  📦
                </motion.div>
              </div>
              <h1 className="auth-title">SmartStock</h1>
              <p className="auth-subtitle">Sign in to manage your inventory</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5" aria-label="Sign in form">
              <motion.div custom={0} variants={prefersReducedMotion ? undefined : fieldVariants} initial="initial" animate="animate">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="modern-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  inputMode="email"
                  autoComplete="email"
                />
              </motion.div>

              <motion.div custom={1} variants={prefersReducedMotion ? undefined : fieldVariants} initial="initial" animate="animate">
                <label className="form-label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="modern-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="btn-icon"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </motion.div>

              <motion.div custom={2} variants={prefersReducedMotion ? undefined : fieldVariants} initial="initial" animate="animate" className="inline-group">
                <label className="checkbox">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" className="btn-link" onClick={() => setError('Password reset is not configured.')}>Forgot password?</button>
              </motion.div>

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" loading={isLoading} fullWidth size="lg" className="font-semibold">
                Sign In
              </Button>
              <Button type="button" variant="outline" fullWidth onClick={async () => { const res = await authAPI.loginWithGoogle(); if (res.success) onLogin(res.data.user); else setError(res.error || 'Google login failed'); }}>Sign in with Google</Button>
            </form>

            <motion.p className="helper-text text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Tip: Use your registered email and password. New here? Ask admin to enable Sign Up.
            </motion.p>
          </Card>
        </motion.div>
  </motion.div>
  );
}
